import {
  Check,
  Copy,
  LockKeyhole,
  ShieldCheck,
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

function SecretRevealed() {
  const [copied, setCopied] = useState(false);

  // Temporary content for frontend testing.
  // The integrator will replace this with the real
  // ciphertext/decoded message from the backend.
  const secretMessage =
    'Your secure capsule message will appear here.';

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(secretMessage);

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error('Could not copy secret:', error);
    }
  }

  return (
    <main className="secret-page">
      <section className="secret-hero">
        <div className="page-glow page-glow-one" />
        <div className="page-glow page-glow-two" />

        <div className="secret-card">
          <div className="secret-success-icon">
            <Check size={34} aria-hidden="true" />
          </div>

          <span className="eyebrow">
            CAPSULE UNLOCKED
          </span>

          <h1>
            Your secret is
            <br />
            <span>ready to view.</span>
          </h1>

          <p className="secret-description">
            The capsule was successfully unlocked.
            Keep this information private.
          </p>

          <div className="secret-message-card">
            <div className="secret-message-header">
              <div>
                <span>SECURE MESSAGE</span>
              </div>

              <LockKeyhole
                size={18}
                aria-hidden="true"
              />
            </div>

            <div className="secret-message">
              {secretMessage}
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
                  <Check size={16} />
                  Copied
                </>
              ) : (
                <>
                  <Copy size={16} />
                  Copy Message
                </>
              )}
            </button>
          </div>

          <div className="secret-warning">
            <ShieldCheck
              size={17}
              aria-hidden="true"
            />

            <p>
              This capsule is temporary. Access may no
              longer be available after its configured
              expiration or read limit.
            </p>
          </div>

          <Link
            to="/"
            className="secondary-button secret-home-button"
          >
            Return to Home
          </Link>
        </div>
      </section>
    </main>
  );
}

export default SecretRevealed;