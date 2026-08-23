import { Check, Copy, ArrowRight } from 'lucide-react';

function CapsuleCreated() {
  return (
    <main className="success-page">
      <div className="success-card">
        <div className="success-icon" aria-hidden="true">
          <Check size={28} />
        </div>

        <span className="eyebrow">Capsule created</span>

        <h1>Your private capsule is ready</h1>

        <p className="success-description">
          Your capsule has been prepared. Share the secure link
          only with the person who needs the information.
        </p>

        <div className="link-box">
          <span className="capsule-link">
            https://crimson-code.example/c/8fK2xP
          </span>

          <button
            type="button"
            className="copy-button"
            aria-label="Copy capsule link"
          >
            <Copy size={18} aria-hidden="true" />
            <span>Copy</span>
          </button>
        </div>

        <p className="expiry-message">
          This capsule will expire according to the
          expiration setting you selected.
        </p>

        <div className="success-actions">
          <button type="button" className="primary-button">
            Create another capsule
            <ArrowRight size={18} aria-hidden="true" />
          </button>
        </div>
      </div>
    </main>
  );
}

export default CapsuleCreated;