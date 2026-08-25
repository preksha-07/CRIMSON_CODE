import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RetrieveCapsule from './RetrieveCapsule';

// Mock react-router-dom navigation and parameters
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = (await vi.importActual('react-router-dom')) as any;
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ id: 'test-capsule-id' }),
  };
});

// Polyfill VITE_API_BASE_URL for testing
import.meta.env.VITE_API_BASE_URL = 'http://localhost:3000';

// Cryptographic helper mirroring production parameters to generate valid ciphertext
const PBKDF2_ITERATIONS = 310000;

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function deriveEncryptionKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt'],
  );
}

async function mockEncrypt(message: string, password: string) {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveEncryptionKey(password, salt);
  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    key,
    encoder.encode(message),
  );
  return {
    ciphertext: bytesToBase64(new Uint8Array(encryptedBuffer) as any),
    metadata: {
      iv: bytesToBase64(iv),
      salt: bytesToBase64(salt),
      algorithm: 'AES-GCM',
      kdf: 'PBKDF2',
      kdfIterations: PBKDF2_ITERATIONS,
    },
  };
}

describe('RetrieveCapsule Component - Decryption security-critical behavior', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockNavigate.mockReset();
  });

  it('successful capsule retrieval and client-side decryption reveals message', async () => {
    const testSecret = 'Plaintext Decrypted Secret!';
    const testPassword = 'unlockpwd123';
    const encryptedData = await mockEncrypt(testSecret, testPassword);

    const fetchSpy = vi.spyOn(window, 'fetch').mockImplementation(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            ciphertext: encryptedData.ciphertext,
            metadata: encryptedData.metadata,
          }),
      } as Response)
    );

    render(<RetrieveCapsule />);
    const user = userEvent.setup();

    // Enter correct password
    const passwordInput = screen.getByLabelText(/capsule password/i);
    await user.type(passwordInput, testPassword);

    // Unlock capsule
    const unlockBtn = screen.getByRole('button', { name: /unlock capsule/i });
    await user.click(unlockBtn);

    // Verify GET API request
    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
    const [url] = fetchSpy.mock.calls[0];
    expect(url).toBe('http://localhost:3000/api/capsules/test-capsule-id');

    // Verify decrypted output triggers navigation to success page with secret
    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith('/secret-revealed', {
        state: { message: testSecret },
      })
    );
  });
});
