import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { consumeReturnTo, consumeSessionExpired, isVoluntaryLogout, peekReturnTo, peekSessionExpired } from '../api/client';
import { extractError, useAuth } from '../auth/AuthContext';
import { AuthCard } from '../components/AuthCard';
import { allowedAppPath, homePath } from '../utils/destinations';
import { isSafeReturnPath, pathFromLocation } from '../utils/returnTo';

export function LoginPage() {
  const { user, ready, mfa, login, verifyMfa, cancelMfa } = useAuth();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [recovery, setRecovery] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [expiredNotice, setExpiredNotice] = useState(
    () => !isVoluntaryLogout() && (Boolean(location.state?.expired) || peekSessionExpired())
  );
  const fromPath = pathFromLocation(location.state?.from);
  const requested = isSafeReturnPath(fromPath) ? fromPath : peekReturnTo() || '';
  const resetNotice = location.state?.reset
    ? 'Password updated. Sign in with your new password.'
    : location.state?.signup
      ? location.state?.username
        ? `Account created. Sign in with username ${location.state.username}.`
        : 'Account created. Sign in with your new password.'
      : '';

  useEffect(() => {
    consumeSessionExpired();
  }, []);

  useEffect(() => {
    if (user) {
      consumeReturnTo();
    }
  }, [user]);

  if (ready && user) {
    const destination = allowedAppPath(user, isSafeReturnPath(requested) ? requested : homePath(user));
    return <Navigate to={destination} replace />;
  }

  async function handleLogin(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(username.trim(), password);
    } catch (err) {
      setError(extractError(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleMfa(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      await verifyMfa(code.trim(), recovery);
    } catch (err) {
      setError(extractError(err));
    } finally {
      setBusy(false);
    }
  }

  if (mfa) {
    return (
      <AuthCard
        title="Multi-factor authentication"
        lead={
          <>
            Enter the {recovery ? 'recovery code' : 'authenticator code'} for{' '}
            <strong>{mfa.username}</strong>.
          </>
        }
      >
        <form onSubmit={handleMfa}>
          {error ? <div className="form-error">{error}</div> : null}
          <div className="field">
            <label htmlFor="code">{recovery ? 'Recovery code' : 'Verification code'}</label>
            <input
              id="code"
              className={`input ${recovery ? '' : 'mfa-code'}`}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              autoComplete="one-time-code"
              inputMode={recovery ? 'text' : 'numeric'}
              autoFocus
              required
            />
          </div>
          <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
            {busy ? 'Verifying…' : 'Continue'}
          </button>
        </form>
        <div className="login-links">
          <button
            className="link-btn"
            type="button"
            onClick={() => {
              setRecovery((value) => !value);
              setCode('');
              setError('');
            }}
          >
            {recovery ? 'Use authenticator code' : 'Use a recovery code'}
          </button>
          <button
            className="link-btn"
            type="button"
            onClick={() => {
              cancelMfa();
              setCode('');
              setError('');
            }}
          >
            Back to sign in
          </button>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Sign in"
      lead="Use your BrightGrid username or company email and password."
    >
      <form onSubmit={handleLogin}>
        {expiredNotice ? (
          <div className="form-error">Session expired. Sign in again to continue.</div>
        ) : null}
        {resetNotice ? <div className="form-ok">{resetNotice}</div> : null}
        {error ? <div className="form-error">{error}</div> : null}
        <div className="field">
          <label htmlFor="username">Username or email</label>
          <input
            id="username"
            className="input"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              if (expiredNotice) setExpiredNotice(false);
            }}
            autoComplete="username"
            autoFocus
            required
          />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>
        <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <div className="login-links">
        <Link to="/forgot-password">Forgot password?</Link>
        <Link to="/signup">Create account</Link>
      </div>
    </AuthCard>
  );
}
