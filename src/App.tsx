import {
  BrowserRouter,
  Routes,
  Route,
} from 'react-router-dom';

import CapsuleCreated from './pages/CapsuleCreated';
import HowItWorks from './pages/HowItWorks';
import Security from './pages/Security';
import About from './pages/About';

import Navbar from './components/layout/Navbar';
import Hero from './components/layout/Hero';

import CreateCapsule from './pages/CreateCapsule';
import RetrieveCapsule from './pages/RetrieveCapsule';

import CapsuleUnavailable from './pages/CapsuleUnavailable';
import SecretRevealed from './pages/SecretRevealed';

function App() {
  return (
    <BrowserRouter>
      <main className="app">
        <Navbar />

        <Routes>
          {/* Home */}
          <Route
            path="/"
            element={<Hero />}
          />

          {/* Create */}
          <Route
            path="/create"
            element={<CreateCapsule />}
          />

          {/* Created capsule */}
          <Route
            path="/capsule-created"
            element={<CapsuleCreated />}
          />

          {/* Retrieve capsule */}
          <Route
            path="/capsule/:id"
            element={<RetrieveCapsule />}
          />

          {/* Capsule unavailable */}
          <Route
            path="/capsule-unavailable"
            element={<CapsuleUnavailable />}
          />

          {/* Successfully decrypted secret */}
          <Route
            path="/secret-revealed"
            element={<SecretRevealed />}
          />

          {/* Information pages */}
          <Route
            path="/how-it-works"
            element={<HowItWorks />}
          />

          <Route
            path="/security"
            element={<Security />}
          />

          <Route
            path="/about"
            element={<About />}
          />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default App;