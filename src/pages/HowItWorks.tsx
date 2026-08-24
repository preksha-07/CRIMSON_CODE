import {
  ArrowRight,
  Clock3,
  FileText,
  Share2,
  ShieldCheck,
} from 'lucide-react';
import { Link } from 'react-router-dom';

function HowItWorks() {
  return (
    <main className="info-page how-page">
      {/* HERO */}
      <section className="info-hero animated-hero">
        <div className="page-glow page-glow-one" />
        <div className="page-glow page-glow-two" />

        <div className="info-hero-content">
          <span className="eyebrow">HOW IT WORKS</span>

          <h1>
            Four simple steps.
            <br />
            <span>One temporary capsule.</span>
          </h1>

          <p>
            Create a capsule, protect your information,
            share it with the right person, and let it
            disappear when its job is done.
          </p>
        </div>
      </section>

      {/* STEPS */}
      <section
        className="timeline-section"
        aria-label="How Crimson Code works"
      >
        <div className="timeline-line" aria-hidden="true" />

        {/* STEP 1 */}
        <article className="timeline-card">
          <div className="timeline-number">01</div>

          <div className="timeline-icon">
            <FileText size={25} aria-hidden="true" />
          </div>

          <div className="timeline-content">
            <span>STEP ONE</span>

            <h2>Create</h2>

            <p>
              Write the sensitive information you want
              to place inside your capsule.
            </p>
          </div>
        </article>

        {/* STEP 2 */}
        <article className="timeline-card reverse">
          <div className="timeline-number">02</div>

          <div className="timeline-icon">
            <ShieldCheck size={25} aria-hidden="true" />
          </div>

          <div className="timeline-content">
            <span>STEP TWO</span>

            <h2>Protect</h2>

            <p>
              Choose how long your capsule should remain
              available and configure its access settings.
            </p>
          </div>
        </article>

        {/* STEP 3 */}
        <article className="timeline-card">
          <div className="timeline-number">03</div>

          <div className="timeline-icon">
            <Share2 size={25} aria-hidden="true" />
          </div>

          <div className="timeline-content">
            <span>STEP THREE</span>

            <h2>Share</h2>

            <p>
              Copy the generated capsule link and share
              it with the person who needs access.
            </p>
          </div>
        </article>

        {/* STEP 4 */}
        <article className="timeline-card reverse">
          <div className="timeline-number">04</div>

          <div className="timeline-icon">
            <Clock3 size={25} aria-hidden="true" />
          </div>

          <div className="timeline-content">
            <span>STEP FOUR</span>

            <h2>Expire</h2>

            <p>
              When the capsule reaches its expiration or
              configured read limit, it becomes unavailable.
            </p>
          </div>
        </article>
      </section>

      {/* BOTTOM CTA */}
      <section className="info-cta animated-cta">
        <div className="cta-icon">
          <ShieldCheck size={28} aria-hidden="true" />
        </div>

        <span className="eyebrow">READY WHEN YOU ARE</span>

        <h2>
          Make sensitive sharing temporary.
        </h2>

        <p>
          Create your first capsule and share information
          with more control.
        </p>

        <Link to="/create" className="primary-button">
          Create Capsule
          <ArrowRight size={18} aria-hidden="true" />
        </Link>
      </section>
    </main>
  );
}

export default HowItWorks;