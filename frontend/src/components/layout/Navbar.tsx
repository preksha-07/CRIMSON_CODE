import { ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

function Navbar() {
  return (
    <header className="navbar">
      <Link
        to="/"
        className="brand"
        aria-label="CRIMSON_CODE home"
      >
        <span className="brand-mark" aria-hidden="true">
          <ShieldCheck size={18} strokeWidth={2.2} />
        </span>

        <span>CRIMSON_CODE</span>
      </Link>

      <nav
        className="nav-links"
        aria-label="Main navigation"
      >
        <a href="#how-it-works">
          How it works
        </a>

        <a href="#security">
          Security
        </a>

        <a href="#about">
          About
        </a>
      </nav>

      <Link
        to="/create"
        className="nav-button"
      >
        Create Capsule
      </Link>
    </header>
  );
}

export default Navbar;