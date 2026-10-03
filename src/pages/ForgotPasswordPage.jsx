import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { forgotPassword } from '../api/auth';
import { extractError } from '../api/client';
import { AuthCard } from '../components/AuthCard';
import { BRIGHTGRID_EMAIL_MESSAGE, BRIGHTGRID_EMAIL_PATTERN, isBrightGridEmail } from '../utils/email';

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setNotice('');
    const trimmed = email.trim();
    if (!isBrightGridEmail(trimmed)) {
      setError(BRIGHTGRID_EMAIL_MESSAGE);
      return;
    }
    setBusy(true);
    try {
      await forgotPassword(trimmed);
      setNotice(
        'If an account exists, we sent a 6-digit OTP to the registered BrightGrid email. Check the inbox and the spam folder.'
      );
      window.setTimeout(() => {
        navigate(`/reset-password?email=${encodeURIComponent(trimmed)}`);
      }, 900);
    } catch (err) {
      setError(extractError(err) || 'Could not send the reset email.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthCard
      title="Forgot password"
      lead="Enter the BrightGrid email on the directory account. If it matches, we email a 6-digit OTP to that registered address."
    >
      <form onSubmit={handleSubmit}>
        {error ? (
          <div className="form-error" style={{ whiteSpace: 'pre-wrap' }}>
            {error}
          </div>
        ) : null}
        {notice ? <div className="form-ok">{notice}</div> : null}
        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            autoFocus
            required
            pattern={BRIGHTGRID_EMAIL_PATTERN}
            title={BRIGHTGRID_EMAIL_MESSAGE}
          />
        </div>
        <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
          {busy ? 'Sending OTP…' : 'Send reset'}
        </button>
      </form>

      <div className="login-links">
        <Link to="/login">Back to sign in</Link>
        <Link to="/signup">Create account</Link>
        <Link
          to={
            email.trim()
              ? `/reset-password?email=${encodeURIComponent(email.trim())}`
              : '/reset-password'
          }
        >
          I already have an OTP
        </Link>
      </div>
    </AuthCard>
  );
}
