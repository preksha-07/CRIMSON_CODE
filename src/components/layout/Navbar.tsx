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
        <Link to="/how-it-works">
          How it works
        </Link>

        <Link to="/security">
          Security
        </Link>

        <Link to="/about">
          About
        </Link>
      </nav>

      <div className="nav-actions">
        <Link
          to="/capsule/demo"
          className="nav-retrieve-button"
        >
          Retrieve Capsule
        </Link>

        <Link
          to="/create"
          className="nav-button"
        >
          Create Capsule
        </Link>
      </div>
    </header>
  );
}

export default Navbar;