import { useState } from 'react';
import {
  AlertCircle,
  Eye,
  EyeOff,
  LockKeyhole,
  ShieldCheck,
} from 'lucide-react';

function RetrieveCapsule() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!password.trim()) {
      setError('Please enter the capsule password.');
      return;
    }

    setError('');

    // Backend integration will happen here.
  }

  return (
    <main className="retrieve-page">
      <section className="retrieve-hero">
        <div className="page-glow page-glow-one" />
        <div className="page-glow page-glow-two" />

        <div className="retrieve-card">
          <div className="retrieve-icon">
            <LockKeyhole size={32} />
          </div>

          <span className="eyebrow">
            SECURE CAPSULE
          </span>

          <h1>
            Unlock the
            <br />
            <span>capsule.</span>
          </h1>

          <p className="retrieve-description">
            This capsule is password protected. Enter the
            password provided by the sender to retrieve
            the information.
          </p>

          <form
            className="retrieve-form"
            onSubmit={handleSubmit}
            noValidate
          >
            <label htmlFor="capsule-password">
              <LockKeyhole size={16} />
              Capsule password
            </label>

            <div className="password-wrapper">
              <input
                id="capsule-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setError('');
                }}
                placeholder="Enter password"
                autoComplete="off"
                required
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() =>
                  setShowPassword(!showPassword)
                }
                aria-label={
                  showPassword
                    ? 'Hide password'
                    : 'Show password'
                }
              >
                {showPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>

            {error && (
              <div className="form-error" role="alert">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="primary-button retrieve-button"
            >
              Unlock Capsule
              <span>→</span>
            </button>
          </form>

          <div className="retrieve-note">
            <ShieldCheck size={17} />

            <span>
              Your access is protected by the capsule's
              security settings.
            </span>
          </div>
        </div>
      </section>
    </main>
  );
}

export default RetrieveCapsule;