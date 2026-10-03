import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { setSignupPassword } from '../api/auth';
import { extractError } from '../api/client';
import { AuthCard } from '../components/AuthCard';
import { BRIGHTGRID_EMAIL_MESSAGE, BRIGHTGRID_EMAIL_PATTERN, isBrightGridEmail } from '../utils/email';

export function SetSignupPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const emailFromQuery = useMemo(() => searchParams.get('email') || '', [searchParams]);
  const [email, setEmail] = useState(emailFromQuery);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    const trimmedEmail = email.trim();
    if (!isBrightGridEmail(trimmedEmail)) {
      setError(BRIGHTGRID_EMAIL_MESSAGE);
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setBusy(true);
    try {
      const created = await setSignupPassword(trimmedEmail, password);
      navigate('/login', {
        replace: true,
        state: {
          signup: true,
          username: created?.username,
        },
      });
    } catch (err) {
      setError(extractError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthCard
      title="Set password"
      lead="Choose a password for the new directory account. You will not pick ADMIN or SUPERADMIN here."
    >
      <form onSubmit={handleSubmit}>
        {error ? <div className="form-error">{error}</div> : null}
        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            className="input"
            type="email"
            value={email}
            readOnly={Boolean(emailFromQuery)}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
            pattern={BRIGHTGRID_EMAIL_PATTERN}
            title={BRIGHTGRID_EMAIL_MESSAGE}
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
            autoComplete="new-password"
            minLength={8}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="confirmPassword">Confirm password</label>
          <input
            id="confirmPassword"
            className="input"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
          />
        </div>
        <p className="lead">
          Use at least 8 characters with uppercase, lowercase, a digit, and a special character.
        </p>
        <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
          {busy ? 'Creating account…' : 'Create account'}
        </button>
      </form>
      <p className="lead" style={{ marginTop: '1rem' }}>
        The account starts with the standard USER role. Superadmin assigns remaining roles from Users after you exist in the directory.
      </p>
      <div className="login-links">
        <Link to="/login">Back to sign in</Link>
        <Link to="/signup">Start over</Link>
      </div>
    </AuthCard>
  );
}
