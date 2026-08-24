import {
  AlertTriangle,
  ArrowLeft,
  Clock3,
  ShieldX,
} from 'lucide-react';
import { Link } from 'react-router-dom';

function CapsuleUnavailable() {
  return (
    <main className="unavailable-page">
      <section className="unavailable-hero">
        <div className="page-glow page-glow-one" />
        <div className="page-glow page-glow-two" />

        <div className="unavailable-card">
          <div className="unavailable-icon">
            <ShieldX size={34} aria-hidden="true" />
          </div>

          <span className="eyebrow">
            CAPSULE UNAVAILABLE
          </span>

          <h1>
            This capsule
            <br />
            <span>is no longer available.</span>
          </h1>

          <p className="unavailable-description">
            The capsule may have expired or reached its maximum
            number of allowed reads. For your protection, its
            contents can no longer be accessed.
          </p>

          <div className="unavailable-reasons">
            <div className="unavailable-reason">
              <Clock3 size={19} aria-hidden="true" />

              <div>
                <strong>Expired</strong>
                <span>
                  The capsule passed its expiration time.
                </span>
              </div>
            </div>

            <div className="unavailable-reason">
              <AlertTriangle
                size={19}
                aria-hidden="true"
              />

              <div>
                <strong>Read limit reached</strong>
                <span>
                  The maximum number of accesses was used.
                </span>
              </div>
            </div>
          </div>

          <Link
            to="/"
            className="secondary-button unavailable-back"
          >
            <ArrowLeft size={17} aria-hidden="true" />
            Back to Home
          </Link>

          <div className="unavailable-note">
            <ShieldX size={16} aria-hidden="true" />

            <span>
              This information is no longer accessible by design.
            </span>
          </div>
        </div>
      </section>
    </main>
  );
}

export default CapsuleUnavailable;