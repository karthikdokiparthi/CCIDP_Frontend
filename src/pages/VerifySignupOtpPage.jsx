import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { verifySignupOtp } from '../api/auth';
import { extractError } from '../api/client';
import { AuthCard } from '../components/AuthCard';
import { BRIGHTGRID_EMAIL_MESSAGE, BRIGHTGRID_EMAIL_PATTERN, isBrightGridEmail } from '../utils/email';

export function VerifySignupOtpPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const emailFromQuery = useMemo(() => searchParams.get('email') || '', [searchParams]);
  const [email, setEmail] = useState(emailFromQuery);
  const [otp, setOtp] = useState('');
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
    setBusy(true);
    try {
      await verifySignupOtp(trimmedEmail, otp.trim());
      navigate(`/signup/set-password?email=${encodeURIComponent(trimmedEmail)}`);
    } catch (err) {
      setError(extractError(err) || 'Could not verify OTP.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthCard
      title="Verify email"
      lead="Enter the 6-digit OTP sent to your BrightGrid mailbox. A fake address that is not a real inbox cannot finish signup."
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
            autoFocus
            required
          />
        </div>
        <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
          {busy ? 'Verifying…' : 'Verify OTP'}
        </button>
      </form>
      <div className="login-links">
        <Link to="/signup">Back to create account</Link>
        <Link to="/login">Sign in</Link>
      </div>
    </AuthCard>
  );
}
