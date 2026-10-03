import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signup } from '../api/auth';
import { extractError } from '../api/client';
import { AuthCard } from '../components/AuthCard';
import { BRIGHTGRID_EMAIL_MESSAGE, BRIGHTGRID_EMAIL_PATTERN, isBrightGridEmail } from '../utils/email';
import { USERNAME_MESSAGE, USERNAME_PATTERN, isValidUsername } from '../utils/username';

export function SignupPage() {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    const trimmed = email.trim();
    const trimmedUsername = username.trim();
    if (!firstName.trim() || !lastName.trim()) {
      setError('Enter first name and last name.');
      return;
    }
    if (!isValidUsername(trimmedUsername)) {
      setError(USERNAME_MESSAGE);
      return;
    }
    if (!isBrightGridEmail(trimmed)) {
      setError(BRIGHTGRID_EMAIL_MESSAGE);
      return;
    }
    setBusy(true);
    try {
      await signup(firstName.trim(), lastName.trim(), trimmed, trimmedUsername);
      navigate(`/signup/verify-otp?email=${encodeURIComponent(trimmed)}`);
    } catch (err) {
      setError(extractError(err) || 'Could not start account creation.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthCard
      title="Create account"
      lead="Choose a username and a company email (@brightgrid.in or @nccltd.in). Send OTP writes the person into Users as Inactive. After OTP and password they become Active."
    >
      <form onSubmit={handleSubmit}>
        {error ? (
          <div className="form-error" style={{ whiteSpace: 'pre-wrap' }}>
            {error}
          </div>
        ) : null}
        <div className="field">
          <label htmlFor="firstName">First name</label>
          <input
            id="firstName"
            className="input"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            autoComplete="given-name"
            autoFocus
            required
            maxLength={100}
          />
        </div>
        <div className="field">
          <label htmlFor="lastName">Last name</label>
          <input
            id="lastName"
            className="input"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            autoComplete="family-name"
            required
            maxLength={100}
          />
        </div>
        <div className="field">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            className="input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
            minLength={3}
            maxLength={32}
            pattern={USERNAME_PATTERN}
            title={USERNAME_MESSAGE}
          />
        </div>
        <p className="lead">Used to sign in. 3–32 letters, digits, dots, underscores, or hyphens.</p>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
            pattern={BRIGHTGRID_EMAIL_PATTERN}
            title={BRIGHTGRID_EMAIL_MESSAGE}
          />
        </div>
        <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
          {busy ? 'Sending OTP…' : 'Send OTP'}
        </button>
      </form>
      <p className="lead" style={{ marginTop: '1rem' }}>
        New accounts appear on the Users page immediately (Inactive until password is set). They get the USER role; Superadmin assigns more later.
      </p>
      <div className="login-links">
        <Link to="/login">Back to sign in</Link>
        <Link
          to={
            email.trim()
              ? `/signup/verify-otp?email=${encodeURIComponent(email.trim())}`
              : '/signup/verify-otp'
          }
        >
          I already have an OTP
        </Link>
      </div>
    </AuthCard>
  );
}
