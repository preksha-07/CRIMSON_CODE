import { BrowserRouter, Routes, Route } from 'react-router-dom';

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
          <Route path="/" element={<Hero />} />

          <Route
            path="/create"
            element={<CreateCapsule />}
          />

          <Route
            path="/capsule-created"
            element={<CapsuleCreated />}
          />

          <Route
            path="/capsule/:id"
            element={<RetrieveCapsule />}
          />

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
          <Route
  path="/capsule-unavailable"
  element={<CapsuleUnavailable />}
  
/>
<Route
  path="/secret-revealed"
  element={<SecretRevealed />}
/>
        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default App;