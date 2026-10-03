import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { resetPassword } from '../api/auth';
import { extractError } from '../api/client';
import { AuthCard } from '../components/AuthCard';
import { BRIGHTGRID_EMAIL_MESSAGE, BRIGHTGRID_EMAIL_PATTERN, isBrightGridEmail } from '../utils/email';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const emailFromQuery = useMemo(() => searchParams.get('email') || '', [searchParams]);
  const [email, setEmail] = useState(emailFromQuery);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
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
    if (!/^\d{6}$/.test(otp.trim())) {
      setError('Enter the 6-digit OTP from your email.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setBusy(true);
    try {
      await resetPassword(trimmedEmail, otp.trim(), newPassword);
      navigate('/login', { replace: true, state: { reset: true } });
    } catch (err) {
      setError(extractError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthCard
      title="Reset password"
      lead="Use the 6-digit OTP from your BrightGrid email, then choose a new password."
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
          <label htmlFor="otp">OTP</label>
          <input
            id="otp"
            className="input"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            required
          />
        </div>
        <div className="field">
          <label htmlFor="newPassword">New password</label>
          <input
            id="newPassword"
            className="input"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
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
        <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
          {busy ? 'Updating…' : 'Update password'}
        </button>
      </form>
      <div className="login-links">
        <Link to="/login">Back to sign in</Link>
        <Link to="/forgot-password">Request a new OTP</Link>
      </div>
    </AuthCard>
  );
}
