import { BrowserRouter, Routes, Route } from 'react-router-dom';
import CapsuleCreated from './pages/CapsuleCreated';
import Navbar from './components/layout/Navbar';
import Hero from './components/layout/Hero';
import CreateCapsule from './pages/CreateCapsule';

function Home() {
  return (
    <>
      <Navbar />
      <Hero />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <main className="app">
        <Routes>
          <Route path="/" element={<Home />} />

          <Route
            path="/create"
            element={<CreateCapsule />}
          />

          <Route
            path="/capsule-created"
            element={<CapsuleCreated />}
          />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default App;