import {
  EyeOff,
  Fingerprint,
  LockKeyhole,
  ShieldCheck,
  Timer,
} from 'lucide-react';

function Security() {
  return (
    <main className="info-page security-page">
      <section className="info-hero security-hero">
        <div className="page-glow page-glow-one" />
        <div className="page-glow page-glow-two" />

        <div className="info-hero-content">
          <span className="eyebrow">SECURITY</span>

          <div className="security-hero-icon">
            <ShieldCheck size={34} aria-hidden="true" />
          </div>

          <h1>
            Security should feel
            <br />
            <span>simple and intentional.</span>
          </h1>

          <p>
            Crimson Code is designed around controlled,
            temporary sharing of sensitive information.
          </p>
        </div>
      </section>

      <section
        className="security-features"
        aria-label="Security features"
      >
        <article className="security-feature-card">
          <div className="security-feature-icon">
            <LockKeyhole size={25} aria-hidden="true" />
          </div>

          <span>01</span>

          <h2>Controlled access</h2>

          <p>
            Capsules are created for intentional sharing,
            giving you a clear way to control who receives
            the information.
          </p>
        </article>

        <article className="security-feature-card">
          <div className="security-feature-icon">
            <EyeOff size={25} aria-hidden="true" />
          </div>

          <span>02</span>

          <h2>Privacy focused</h2>

          <p>
            Sensitive information should not remain available
            longer than it needs to. Temporary access helps
            keep sharing purposeful.
          </p>
        </article>

        <article className="security-feature-card">
          <div className="security-feature-icon">
            <Timer size={25} aria-hidden="true" />
          </div>

          <span>03</span>

          <h2>Time limited</h2>

          <p>
            Capsules can have an expiration time, helping
            reduce unnecessary long-term availability.
          </p>
        </article>

        <article className="security-feature-card">
          <div className="security-feature-icon">
            <Fingerprint size={25} aria-hidden="true" />
          </div>

          <span>04</span>

          <h2>Designed for sensitive data</h2>

          <p>
            Security-related choices are kept visible and
            understandable instead of being hidden from you.
          </p>
        </article>
      </section>

      <section className="security-principle">
        <div className="principle-icon">
          <ShieldCheck size={30} aria-hidden="true" />
        </div>

        <div>
          <span className="eyebrow">THE PRINCIPLE</span>

          <h2>
            Share what is needed.
            <br />
            Keep it only as long as needed.
          </h2>

          <p>
            Crimson Code is built around the idea that sensitive
            information should have a clear purpose and a
            defined lifecycle.
          </p>
        </div>
      </section>
    </main>
  );
}

export default Security;