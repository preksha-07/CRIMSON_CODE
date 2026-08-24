import {
  ShieldCheck,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';

function Hero() {
  return (
    <main className="home-page">
      <section className="hero">
        <div className="hero-glow hero-glow-one" />
        <div className="hero-glow hero-glow-two" />

        <div className="hero-content">
          <div className="hero-badge">
            <ShieldCheck
              size={17}
              aria-hidden="true"
            />

            <span>PRIVATE BY DESIGN</span>
          </div>

          <h1>
            Share something now.
            <br />
            <span>Let it disappear later.</span>
          </h1>

          <p className="hero-description">
            Create a secure capsule for sensitive information,
            share it privately, and let it expire when its job
            is done.
          </p>

          {/* MAIN ACTIONS */}
          <div className="hero-actions">
  <Link
    to="/create"
    className="primary-button"
  >
    Create Capsule
    <ArrowRight size={18} aria-hidden="true" />
  </Link>

  <Link
    to="/capsule/demo"
    className="secondary-button"
  >
    Retrieve Capsule
    <ShieldCheck size={18} aria-hidden="true" />
  </Link>
</div>          <div className="hero-trust">
            <div>
              <ShieldCheck
                size={16}
                aria-hidden="true"
              />

              <span>Privacy focused</span>
            </div>

            <div>
              <Sparkles
                size={16}
                aria-hidden="true"
              />

              <span>Temporary sharing</span>
            </div>
          </div>
        </div>
      </section>

      {/* WHY CRIMSON_CODE */}
      <section className="home-intro">
        <span className="eyebrow">
          WHY CRIMSON_CODE
        </span>

        <h2>
          Sensitive information
          <br />
          deserves a shorter lifetime.
        </h2>

        <p>
          Create a capsule, share it with the right person,
          and let its lifecycle handle the rest.
        </p>

        <div className="home-feature-grid">
          <article className="home-feature-card">
            <span>01</span>

            <h3>Controlled</h3>

            <p>
              Share information intentionally with the people
              who need it.
            </p>
          </article>

          <article className="home-feature-card">
            <span>02</span>

            <h3>Temporary</h3>

            <p>
              Give your information a defined lifetime instead
              of keeping it around forever.
            </p>
          </article>

          <article className="home-feature-card">
            <span>03</span>

            <h3>Simple</h3>

            <p>
              Create, copy, share. No complicated workflow.
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}

export default Hero;