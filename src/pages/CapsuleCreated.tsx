import {
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  Plus,
  ShieldCheck,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';

function CapsuleCreated() {
  const [copied, setCopied] = useState(false);

  // Temporary link for the frontend UI.
  // Your backend can replace this with the real capsule URL.
  const capsuleLink =
    `${window.location.origin}/capsule/demo`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(capsuleLink);

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2200);
    } catch (error) {
      console.error('Could not copy link:', error);
    }
  }

  return (
    <main className="capsule-created-page">
      <section className="created-hero">
        <div className="page-glow page-glow-one" />
        <div className="page-glow page-glow-two" />

        <div className="created-content">
          {/* SUCCESS ICON */}
          <div className="created-success-icon">
            <CheckCircle2
              size={38}
              strokeWidth={1.8}
              aria-hidden="true"
            />
          </div>

          <span className="eyebrow">
            CAPSULE CREATED
          </span>

          <h1>
            Your capsule is
            <br />
            <span>ready to share.</span>
          </h1>

          <p className="created-description">
            Your secure capsule has been created.
            Copy the link below and share it with the
            person who needs access.
          </p>

          {/* LINK CARD */}
          <div className="capsule-link-card">
            <div className="link-card-header">
              <div>
                <span className="link-label">
                  CAPSULE LINK
                </span>

                <p>
                  Anyone with the link can request access
                  using the capsule password.
                </p>
              </div>

              <ShieldCheck
                size={21}
                aria-hidden="true"
              />
            </div>

            <div className="link-box">
              <span className="capsule-link">
                {capsuleLink}
              </span>

              <button
                type="button"
                className={`copy-button ${
                  copied ? 'copied' : ''
                }`}
                onClick={handleCopy}
                aria-label={
                  copied
                    ? 'Capsule link copied'
                    : 'Copy capsule link'
                }
              >
                {copied ? (
                  <>
                    <Check size={17} />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy size={17} />
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>

          {/* STATUS */}
          <div className="capsule-status">
            <div className="status-item">
              <span className="status-dot" />
              <span>Capsule active</span>
            </div>

            <div className="status-divider" />

            <div className="status-item">
              <ShieldCheck
                size={15}
                aria-hidden="true"
              />
              <span>Password protected</span>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="created-actions">
            <button
              type="button"
              className="primary-button share-button"
              onClick={handleCopy}
            >
              {copied ? (
                <>
                  <Check size={18} />
                  Link Copied
                </>
              ) : (
                <>
                  <Copy size={18} />
                  Copy Link
                </>
              )}
            </button>

            <Link
              to="/create"
              className="secondary-button"
            >
              <Plus size={18} />
              Create Another
            </Link>
          </div>

          {/* PRIVACY NOTE */}
          <div className="created-note">
            <ShieldCheck
              size={18}
              aria-hidden="true"
            />

            <p>
              Keep your capsule link private and only
              share it with the intended recipient.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

export default CapsuleCreated;