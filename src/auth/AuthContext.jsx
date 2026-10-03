import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  clearSession,
  expireSession,
  extractError,
  getAccessToken,
  getStoredRefreshToken,
  getStoredUser,
  profileFromLogin,
  refreshAccessToken,
  setSession,
} from '../api/client';
import * as authApi from '../api/auth';
import { isAccessTokenExpiring, rolesFromAccessToken } from '../utils/jwt';
import { normalizeRoles } from '../utils/destinations';

const AuthContext = createContext(null);

function withTokenRoles(profile) {
  if (!profile) return null;
  const fromToken = rolesFromAccessToken(getAccessToken());
  const fromProfile = normalizeRoles(profile.roles);
  return {
    ...profile,
    roles: fromToken.length ? fromToken : fromProfile,
  };
}

function applyMe(profile, me) {
  if (!profile) return null;
  const roles = normalizeRoles(me?.roles);
  const next = {
    ...profile,
    userId: me?.userId || profile.userId,
    username: me?.username || profile.username,
    email: me?.email || profile.email,
    firstName: me?.firstName || profile.firstName,
    lastName: me?.lastName || profile.lastName,
    roles: roles.length ? roles : normalizeRoles(profile.roles),
  };
  setSession({ user: next });
  return next;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => withTokenRoles(getStoredUser()));
  const [ready, setReady] = useState(false);
  const [mfa, setMfa] = useState(null);

  useEffect(() => {
    function onExpired() {
      setUser(null);
      setMfa(null);
    }
    window.addEventListener('ccidp:session-expired', onExpired);
    return () => window.removeEventListener('ccidp:session-expired', onExpired);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      const refreshToken = getStoredRefreshToken();
      if (refreshToken && !getAccessToken()) {
        try {
          await refreshAccessToken();
          if (!cancelled) {
            setUser(withTokenRoles(getStoredUser()));
          }
        } catch {
          if (getStoredUser()) {
            expireSession();
          } else {
            clearSession();
          }
          if (!cancelled) {
            setUser(null);
          }
        }
      }
      if (!cancelled && getStoredUser() && getAccessToken()) {
        try {
          const me = await authApi.getMe();
          if (!cancelled) {
            setUser(applyMe(getStoredUser(), me));
          }
        } catch {
          // Keep stored profile if /me is unavailable.
        }
      }
      if (!cancelled) {
        setReady(true);
      }
    }

    hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!user) return undefined;

    async function maybeRefresh() {
      const token = getAccessToken();
      if (!getStoredRefreshToken()) return;
      if (token && isAccessTokenExpiring(token, 120_000)) {
        try {
          await refreshAccessToken();
        } catch {
          expireSession();
          return;
        }
      }
      try {
        const me = await authApi.getMe();
        setUser((current) => applyMe(current || getStoredUser(), me));
      } catch {
        // Ignore; next interval retries.
      }
    }

    maybeRefresh();
    const timer = window.setInterval(maybeRefresh, 15_000);
    return () => window.clearInterval(timer);
  }, [user]);

  function completeLogin(data) {
    const profile = profileFromLogin(data);
    setSession({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      user: profile,
    });
    setUser(withTokenRoles(profile));
    setMfa(null);
    authApi
      .getMe()
      .then((me) => setUser(applyMe(profile, me)))
      .catch(() => {});
  }

  const value = useMemo(
    () => ({
      user,
      ready,
      mfa,
      async login(username, password) {
        const data = await authApi.login(username, password);
        if (data.mfaChallenge) {
          setMfa({
            mfaChallengeToken: data.mfaChallengeToken,
            username: data.username || username,
          });
          return { mfa: true };
        }
        completeLogin(data);
        return { mfa: false };
      },
      async verifyMfa(code, recovery = false) {
        if (!mfa?.mfaChallengeToken) {
          throw new Error('No MFA challenge is pending');
        }
        const data = recovery
          ? await authApi.verifyMfaRecovery(mfa.mfaChallengeToken, code)
          : await authApi.verifyMfa(mfa.mfaChallengeToken, code);
        completeLogin(data);
      },
      cancelMfa() {
        setMfa(null);
      },
      async logout() {
        const refreshToken = getStoredRefreshToken();
        try {
          if (refreshToken) {
            await authApi.logout(refreshToken);
          }
        } catch {
          // Session is cleared locally either way.
        }
        clearSession();
        setUser(null);
        setMfa(null);
      },
    }),
    [user, ready, mfa]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

export { extractError };
