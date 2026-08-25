import {
  Check,
  Copy,
  LockKeyhole,
  ShieldCheck,
} from 'lucide-react';
import { useState } from 'react';
import { useLocation, Navigate } from 'react-router-dom';

interface SecretRevealedState {
  message?: string;
}

function SecretRevealed() {
  const location = useLocation();

  const state =
    location.state as SecretRevealedState | null;

  const message = state?.message ?? '';

  const [copied, setCopied] = useState(false);

  if (!message) {
    return <Navigate to="/capsule-unavailable" replace />;
  }

  
  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(message);

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error(
        'Could not copy secret:',
        error,
      );
    }
  }

  return (
    <section className="secret-revealed">
      <div className="secret-success-icon">
        <Check size={34} aria-hidden="true" />
      </div>

      <span className="eyebrow">
        CAPSULE UNLOCKED
      </span>

      <h2>
        Your secret is
        <br />
        <span>ready to view.</span>
      </h2>

      <p className="secret-description">
        The message was successfully decrypted in
        your browser.
      </p>

      <div className="secret-message-card">
        <div className="secret-message-header">
          <span>SECURE MESSAGE</span>

          <LockKeyhole
            size={18}
            aria-hidden="true"
          />
        </div>

        <div className="secret-message">
          {message}
        </div>

        <button
          type="button"
          className={`secret-copy-button ${
            copied ? 'copied' : ''
          }`}
          onClick={handleCopy}
        >
          {copied ? (
            <>
              <Check size={16} aria-hidden="true" />
              Copied
            </>
          ) : (
            <>
              <Copy size={16} aria-hidden="true" />
              Copy Message
            </>
          )}
        </button>
      </div>

      <div className="secret-warning" role="note">
        <ShieldCheck
          size={17}
          aria-hidden="true"
        />

        <p>
          The decrypted message is displayed only
          after successful client-side decryption.
          Your password and encryption key are never
          sent to the server.
        </p>
      </div>
    </section>
  );
}

export default SecretRevealed;
