import {
  ShieldCheck,
  ArrowRight,
  LockKeyhole,
  EyeOff,
  Clock3,
} from 'lucide-react';
import { Link } from 'react-router-dom';

function Hero() {
  return (
    <>
      {/* HERO */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-badge">
            <ShieldCheck size={18} aria-hidden="true" />
            <span>Private by design</span>
          </div>

          <h1>
            Share something now.
            <br />
            Let it disappear later.
          </h1>

          <p className="hero-description">
            Create a secure capsule for sensitive information,
            share it privately, and let it expire when its job is done.
          </p>

          <div className="hero-actions">
            <Link to="/create" className="primary-button">
              Create Capsule
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section
        id="how-it-works"
        className="how-it-works"
        aria-labelledby="how-it-works-title"
      >
        <div className="how-it-works-container">
          <div className="section-heading">
            <span className="eyebrow">Simple & secure</span>

            <h2 id="how-it-works-title">
              How it works
            </h2>

            <p>
              Keep sensitive information private without
              making sharing complicated.
            </p>
          </div>

          <div className="steps">
            <article className="step-card">
              <span className="step-number">01</span>

              <h3>Create</h3>

              <p>
                Add the information you want to keep inside
                your capsule.
              </p>
            </article>

            <article className="step-card">
              <span className="step-number">02</span>

              <h3>Protect</h3>

              <p>
                Your capsule is designed to keep sensitive
                information private.
              </p>
            </article>

            <article className="step-card">
              <span className="step-number">03</span>

              <h3>Share</h3>

              <p>
                Share the capsule with the person who needs
                access.
              </p>
            </article>

            <article className="step-card">
              <span className="step-number">04</span>

              <h3>Expire</h3>

              <p>
                The capsule becomes unavailable according
                to its settings.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* SECURITY */}
      <section
        id="security"
        className="security-section"
        aria-labelledby="security-title"
      >
        <div className="security-container">
          <div className="section-heading">
            <span className="eyebrow">Built for privacy</span>

            <h2 id="security-title">
              Security without the complexity.
            </h2>

            <p>
              Crimson Code is designed around temporary,
              controlled sharing of sensitive information.
            </p>
          </div>

          <div className="security-grid">
            <article className="security-card">
              <div className="security-icon">
                <LockKeyhole
                  size={24}
                  aria-hidden="true"
                />
              </div>

              <h3>Private by design</h3>

              <p>
                Sensitive information is handled with privacy
                as a core part of the experience.
              </p>
            </article>

            <article className="security-card">
              <div className="security-icon">
                <EyeOff
                  size={24}
                  aria-hidden="true"
                />
              </div>

              <h3>Controlled access</h3>

              <p>
                Capsules can be shared intentionally instead
                of leaving sensitive information permanently
                exposed.
              </p>
            </article>

            <article className="security-card">
              <div className="security-icon">
                <Clock3
                  size={24}
                  aria-hidden="true"
                />
              </div>

              <h3>Temporary by design</h3>

              <p>
                Set an expiry so the information does not
                need to remain available forever.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section
        id="about"
        className="about-section"
        aria-labelledby="about-title"
      >
        <div className="about-container">
          <div className="section-heading">
            <span className="eyebrow">About Crimson Code</span>

            <h2 id="about-title">
              Share what matters.
              <br />
              Keep it temporary.
            </h2>

            <p>
              Crimson Code is a secure sharing experience
              created for information that should not live
              online forever.
            </p>

            <p>
              Instead of relying on permanent messages or
              long-lived links, capsules are designed around
              controlled access and a defined lifecycle.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

export default Hero;