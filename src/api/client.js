import axios from 'axios';
import { isAccessTokenExpiring } from '../utils/jwt';
import { isSafeReturnPath } from '../utils/returnTo';

const REFRESH_KEY = 'ccidp.refreshToken';
const USER_KEY = 'ccidp.user';
const RETURN_KEY = 'ccidp.returnTo';
const EXPIRED_KEY = 'ccidp.sessionExpired';

let accessToken = null;
let refreshPromise = null;
let endingSession = false;

/** Origin + optional servlet context (`/ccidp`). Empty = same-origin Vite/nginx proxy. */
export function apiOrigin() {
  return String(import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/$/, '');
}

function apiPath(path) {
  const origin = apiOrigin();
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return origin ? `${origin}${suffix}` : suffix;
}

export const api = axios.create({
  baseURL: apiPath('/api/v1'),
  headers: { 'Content-Type': 'application/json' },
});

export function getAccessToken() {
  return accessToken;
}

export function getStoredRefreshToken() {
  return localStorage.getItem(REFRESH_KEY);
}

export function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || 'null');
  } catch {
    return null;
  }
}

export function setSession({ accessToken: token, refreshToken, user }) {
  if (token !== undefined) {
    accessToken = token || null;
  }
  if (refreshToken) {
    localStorage.setItem(REFRESH_KEY, refreshToken);
  }
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
}

export function clearSession() {
  accessToken = null;
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
}

export function peekSessionExpired() {
  return sessionStorage.getItem(EXPIRED_KEY) === '1';
}

export function consumeSessionExpired() {
  const expired = peekSessionExpired();
  if (expired) {
    sessionStorage.removeItem(EXPIRED_KEY);
  }
  return expired;
}

export function peekReturnTo() {
  const path = sessionStorage.getItem(RETURN_KEY);
  return isSafeReturnPath(path) ? path : null;
}

export function consumeReturnTo() {
  const path = peekReturnTo();
  sessionStorage.removeItem(RETURN_KEY);
  return path;
}

export function expireSession() {
  if (endingSession) return;
  endingSession = true;
  const returnTo = `${window.location.pathname}${window.location.search}`;
  if (isSafeReturnPath(returnTo)) {
    sessionStorage.setItem(RETURN_KEY, returnTo);
  }
  sessionStorage.setItem(EXPIRED_KEY, '1');
  clearSession();
  window.dispatchEvent(new CustomEvent('ccidp:session-expired'));
  window.setTimeout(() => {
    endingSession = false;
  }, 0);
}

export function profileFromLogin(data) {
  return {
    userId: data.userId,
    username: data.username,
    email: data.email,
    firstName: data.firstName,
    lastName: data.lastName,
    sessionId: data.sessionId,
    roles: Array.isArray(data.roles) ? data.roles : [],
  };
}

function isAuthSkip(url = '') {
  return (
    url.includes('/auth/login') ||
    url.includes('/auth/refresh') ||
    url.includes('/auth/mfa/') ||
    url.includes('/auth/logout') ||
    url.includes('/auth/forgot-password') ||
    url.includes('/auth/reset-password') ||
    url.includes('/auth/signup')
  );
}

export async function refreshAccessToken() {
  if (refreshPromise) {
    return refreshPromise;
  }

  const refreshToken = getStoredRefreshToken();
  if (!refreshToken) {
    throw new Error('No refresh token');
  }

  refreshPromise = axios
    .post(apiPath('/api/v1/auth/refresh'), { refreshToken })
    .then((response) => {
      const data = response.data?.data;
      setSession({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken || refreshToken,
      });
      return data.accessToken;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

async function ensureFreshAccessToken() {
  if (!getStoredRefreshToken()) {
    return accessToken;
  }
  if (!accessToken || isAccessTokenExpiring(accessToken, 60_000)) {
    return refreshAccessToken();
  }
  return accessToken;
}

api.interceptors.request.use(async (config) => {
  const url = config.url || '';
  if (!isAuthSkip(url) && getStoredRefreshToken()) {
    try {
      await ensureFreshAccessToken();
    } catch {
      expireSession();
      return Promise.reject(new Error('Session expired'));
    }
  }
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config || {};
    const status = error.response?.status;
    const url = original.url || '';

    if (status === 401 && !original._retry && !isAuthSkip(url)) {
      original._retry = true;
      try {
        await refreshAccessToken();
        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${accessToken}`;
        return api(original);
      } catch {
        expireSession();
      }
    }

    return Promise.reject(error);
  }
);

export function extractError(error) {
  const status = error.response?.status;
  const data = error.response?.data;
  let apiMessage = '';

  if (typeof data === 'string') {
    if (/invalid cors request/i.test(data)) {
      return 'This origin is not allowed. Check the identity provider CORS settings.';
    }
    if (/blocked request|allowedHosts|is not allowed/i.test(data)) {
      return 'This host is not allowed to load the admin console.';
    }
    const text = data.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (text && text.length < 220) {
      apiMessage = text;
    }
  } else if (Array.isArray(data) && typeof data[2] === 'string') {
    apiMessage = data[2];
  } else if (data && typeof data === 'object') {
    apiMessage = data.message || data.error || data.detail || '';
  }

  if (apiMessage && !/^Request failed with status code/i.test(apiMessage)) {
    if (status === 403 && /^Forbidden$/i.test(String(apiMessage).trim())) {
      return (
        'This account cannot open the admin console. Sign in with an administrator role, '
        + 'or ask Superadmin to assign more access.'
      );
    }
    return apiMessage;
  }

  if (status === 403) {
    return (
      'You do not have permission to do that. Sign in with an administrator role, '
      + 'or ask Superadmin to assign more access.'
    );
  }

  return error.message || 'Request failed';
}

export function unwrap(response) {
  return response.data?.data;
}
