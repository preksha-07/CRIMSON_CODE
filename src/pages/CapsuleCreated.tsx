
import {
  Check,
  Copy,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

interface CapsuleCreatedState {
  capsuleId?: string;
}

function CapsuleCreated() {
  const location = useLocation();

  const state =
    location.state as CapsuleCreatedState | null;

  const capsuleId = state?.capsuleId;

  const [copied, setCopied] = useState(false);

  const capsuleLink = capsuleId
    ? `${window.location.origin}/capsule/${encodeURIComponent(
        capsuleId,
      )}`
    : '';

  async function handleCopy() {
    if (!capsuleLink) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        capsuleLink,
      );

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error(
        'Could not copy capsule link:',
        error,
      );
    }
  }

  if (!capsuleId) {
    return (
      <main className="capsule-created-page">
        <section className="capsule-created-hero">
          <div className="capsule-created-card">
            <div className="created-icon">
              <ShieldCheck
                size={32}
                aria-hidden="true"
              />
            </div>

            <span className="eyebrow">
              CAPSULE LINK
            </span>

            <h1>
              Capsule link
              <br />
              <span>is unavailable.</span>
            </h1>

            <p className="created-description">
              We could not find the capsule identifier.
              Please create a new capsule.
            </p>

            <Link
              to="/create"
              className="primary-button"
            >
              Create New Capsule
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="capsule-created-page">
      <section className="capsule-created-hero">
        <div className="page-glow page-glow-one" />
        <div className="page-glow page-glow-two" />

        <div className="capsule-created-card">
          <div className="created-icon">
            <Check
              size={34}
              aria-hidden="true"
            />
          </div>

          <span className="eyebrow">
            CAPSULE CREATED
          </span>

          <h1>
            Your secure capsule
            <br />
            <span>is ready.</span>
          </h1>

          <p className="created-description">
            Your message has been encrypted in your
            browser. Share the link below with the
            intended recipient.
          </p>

          <div className="capsule-link-box">
            <label htmlFor="capsule-link">
              Secure capsule link
            </label>

            <div className="capsule-link-row">
              <input
                id="capsule-link"
                value={capsuleLink}
                readOnly
                aria-label="Secure capsule link"
              />

              <button
                type="button"
                className="copy-link-button"
                onClick={handleCopy}
                aria-label={
                  copied
                    ? 'Capsule link copied'
                    : 'Copy capsule link'
                }
              >
                {copied ? (
                  <Check
                    size={18}
                    aria-hidden="true"
                  />
                ) : (
                  <Copy
                    size={18}
                    aria-hidden="true"
                  />
                )}
              </button>
            </div>

            <span
              className="copy-status"
              aria-live="polite"
            >
              {copied
                ? 'Capsule link copied!'
                : 'Anyone with this link can attempt to unlock the capsule.'}
            </span>
          </div>

          <div className="created-actions">
            <a
              href={capsuleLink}
              className="secondary-button"
            >
              Open Capsule
              <ExternalLink
                size={16}
                aria-hidden="true"
              />
            </a>

            <Link
              to="/create"
              className="primary-button"
            >
              Create Another Capsule
              <span aria-hidden="true">→</span>
            </Link>
          </div>

          <div className="security-note" role="note">
            <ShieldCheck
              size={18}
              aria-hidden="true"
            />

            <div>
              <strong>
                Your password stays private
              </strong>

              <p>
                The decryption password and key material
                remain in the client. They are not sent
                to the backend.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default CapsuleCreated;
