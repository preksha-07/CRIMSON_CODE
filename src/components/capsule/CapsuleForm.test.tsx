import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CapsuleForm from './CapsuleForm';

// Mock react-router-dom navigation
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = (await vi.importActual('react-router-dom')) as any;
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Polyfill VITE_API_BASE_URL for testing
import.meta.env.VITE_API_BASE_URL = 'http://localhost:3000';

describe('CapsuleForm Component - Minimal Critical Coverage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockNavigate.mockReset();
  });

  it('valid capsule creation: submits form and performs POST request with encrypted payload', async () => {
    const mockResponse = { id: 'capsule-id-123', expiresAt: '2026-08-24T10:00:00Z' };
    const fetchSpy = vi.spyOn(window, 'fetch').mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response)
    );

    render(<CapsuleForm />);
    const user = userEvent.setup();

    // Fill message and password fields
    const secretInput = screen.getByLabelText(/secret message/i);
    const passwordInput = screen.getByLabelText(/capsule password/i);
    await user.type(secretInput, 'My secret message content');
    await user.type(passwordInput, 'securepassword123');

    // Submit form
    const submitBtn = screen.getByRole('button', { name: /create secure capsule/i });
    await user.click(submitBtn);

    // Verify API call details
    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1), { timeout: 5000 });
    const [calledUrl, calledOptions] = fetchSpy.mock.calls[0];

    expect(calledUrl).toBe('http://localhost:3000/api/capsules');
    expect(calledOptions?.method).toBe('POST');

    const body = JSON.parse(calledOptions?.body as string);
    expect(body).toHaveProperty('ciphertext');
    expect(body.ciphertext).not.toBe('My secret message content'); // Must be encrypted
    expect(body.metadata).toHaveProperty('iv');
    expect(body.metadata).toHaveProperty('salt');
    expect(body.metadata.algorithm).toBe('AES-GCM');
    expect(body.maxReads).toBe(5);

    // Verify transition to success page
    expect(mockNavigate).toHaveBeenCalledWith('/capsule-created', {
      state: { capsuleId: 'capsule-id-123' },
    });
  });

  it('invalid capsule creation: validation error prevents submission', async () => {
    const fetchSpy = vi.spyOn(window, 'fetch');
    render(<CapsuleForm />);
    const user = userEvent.setup();
    const submitBtn = screen.getByRole('button', { name: /create secure capsule/i });

    // Submit empty form
    await user.click(submitBtn);

    const errorMessage = await screen.findByRole('alert', {}, { timeout: 5000 });
    expect(errorMessage).toHaveTextContent('Please enter a secret message.');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('PLAINTEXT MUST NEVER BE SENT TO THE API', async () => {
    const fetchSpy = vi.spyOn(window, 'fetch').mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ id: 'mock-id' }),
      } as Response)
    );

    render(<CapsuleForm />);
    const user = userEvent.setup();

    // Fill message and password fields
    const secretInput = screen.getByLabelText(/secret message/i);
    const passwordInput = screen.getByLabelText(/capsule password/i);
    await user.type(secretInput, 'TOP_SECRET_FRONTEND_TEST_MESSAGE');
    await user.type(passwordInput, 'somepassword123');

    // Submit
    const submitBtn = screen.getByRole('button', { name: /create secure capsule/i });
    await user.click(submitBtn);

    // Verify API POST request body
    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1), { timeout: 5000 });
    const [, options] = fetchSpy.mock.calls[0];
    const serializedBody = options?.body as string;

    // Assert plaintext never appears anywhere in the serialized request body
    expect(serializedBody).not.toContain('TOP_SECRET_FRONTEND_TEST_MESSAGE');

    const body = JSON.parse(serializedBody);
    expect(body).toHaveProperty('ciphertext');
    expect(body.ciphertext).not.toBe('TOP_SECRET_FRONTEND_TEST_MESSAGE');
    expect(body.metadata).toHaveProperty('iv');
    expect(body.metadata).toHaveProperty('salt');
    expect(body.metadata.algorithm).toBe('AES-GCM');
  });
});
