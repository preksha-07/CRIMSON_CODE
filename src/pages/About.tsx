import {
  ArrowRight,
  Clock3,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';

function About() {
  return (
    <main className="info-page about-page">
      <section className="info-hero about-hero">
        <div className="page-glow page-glow-one" />
        <div className="page-glow page-glow-two" />

        <div className="info-hero-content">
          <span className="eyebrow">ABOUT CRIMSON_CODE</span>

          <div className="about-hero-icon">
            <ShieldCheck size={34} aria-hidden="true" />
          </div>

          <h1>
            Information doesn't
            <br />
            <span>need to live forever.</span>
          </h1>

          <p>
            Crimson Code is designed for moments when sensitive
            information needs to be shared, but doesn't need to
            stay available forever.
          </p>
        </div>
      </section>

      <section className="about-story">
        <div className="about-story-heading">
          <span className="eyebrow">THE IDEA</span>

          <h2>
            Give information
            <br />
            a beginning and an end.
          </h2>
        </div>

        <div className="about-story-text">
          <p>
            We share sensitive information every day through
            messages, documents and links.
          </p>

          <p>
            The problem is that those things can remain available
            long after they have served their purpose.
          </p>

          <p>
            Crimson Code takes a different approach: create a
            capsule, share it intentionally, and let its lifecycle
            determine when it should stop being available.
          </p>
        </div>
      </section>

      <section className="about-values">
        <article className="about-value-card">
          <div className="about-value-icon">
            <LockKeyhole size={25} aria-hidden="true" />
          </div>

          <span>01</span>

          <h3>Privacy first</h3>

          <p>
            Sensitive information deserves thoughtful handling
            from creation to expiration.
          </p>
        </article>

        <article className="about-value-card">
          <div className="about-value-icon">
            <Clock3 size={25} aria-hidden="true" />
          </div>

          <span>02</span>

          <h3>Temporary by design</h3>

          <p>
            Information can have a defined lifetime instead of
            becoming permanent by accident.
          </p>
        </article>

        <article className="about-value-card">
          <div className="about-value-icon">
            <Sparkles size={25} aria-hidden="true" />
          </div>

          <span>03</span>

          <h3>Simple experience</h3>

          <p>
            Security should not require a complicated interface.
          </p>
        </article>
      </section>

      <section className="info-cta animated-cta about-cta">
        <ShieldCheck size={28} aria-hidden="true" />

        <span className="eyebrow">CRIMSON_CODE</span>

        <h2>
          Make sensitive sharing temporary.
        </h2>

        <p>
          Create a capsule and decide how long it should live.
        </p>

        <Link to="/create" className="primary-button">
          Create Capsule
          <ArrowRight size={18} aria-hidden="true" />
        </Link>
      </section>
    </main>
  );
}

export default About;