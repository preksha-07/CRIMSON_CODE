import '@testing-library/jest-dom';

// Polyfill Web Crypto API for JSDOM using Node's native global crypto
if (typeof window !== 'undefined' && !window.crypto && typeof globalThis !== 'undefined' && globalThis.crypto) {
  Object.defineProperty(window, 'crypto', {
    value: globalThis.crypto,
    writable: true,
  });
}
