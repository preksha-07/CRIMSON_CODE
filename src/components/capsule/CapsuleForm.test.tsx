import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CapsuleForm from './CapsuleForm';

describe('CapsuleForm Component - Minimal Critical Coverage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('valid capsule creation: submits form and performs POST request with payload', async () => {
    const mockResponse = { id: 'capsule-id-123', expiresAt: '2026-08-24T10:00:00Z' };
    const fetchSpy = vi.spyOn(window, 'fetch').mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response)
    );

    render(<CapsuleForm />);
    const user = userEvent.setup();

    // Fill message field
    const textarea = screen.getByLabelText(/your sensitive information/i);
    await user.type(textarea, 'Test payload message');

    // Submit form
    const submitBtn = screen.getByRole('button', { name: /create secure capsule/i });
    await user.click(submitBtn);

    // Verify API call details
    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
    const [calledUrl, calledOptions] = fetchSpy.mock.calls[0];

    expect(calledUrl).toMatch(/\/api\/capsules$/);
    expect(calledOptions?.method).toBe('POST');

    const body = JSON.parse(calledOptions?.body as string);
    expect(body).toHaveProperty('ciphertext');
    expect(body).toHaveProperty('expiresAt');
    expect(body).toHaveProperty('maxReads');

    // NOTE:
    // - Encryption testing is BLOCKED: The current implementation sends the hardcoded placeholder 'TEMPORARY_ENCRYPTED_VALUE'.
    // - Success navigation testing is BLOCKED: The current component only logs the response to console and does not perform router navigation.
  });

  it('invalid capsule creation: validation error prevents submission', async () => {
    const fetchSpy = vi.spyOn(window, 'fetch');
    render(<CapsuleForm />);
    const user = userEvent.setup();
    const submitBtn = screen.getByRole('button', { name: /create secure capsule/i });

    // Submit empty form
    await user.click(submitBtn);

    const errorMessage = await screen.findByRole('alert');
    expect(errorMessage).toHaveTextContent('Please enter some information before creating a capsule.');
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
