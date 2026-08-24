import { useState } from 'react';
import {
  LockKeyhole,
  Clock3,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MAX_CHARACTERS = 10000;
const PBKDF2_ITERATIONS = 310000;
const SALT_LENGTH = 16;
const IV_LENGTH = 12;

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL;

  interface CreatedCapsule {
  id?: string;
}

  function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary);
}

async function deriveEncryptionKey(
  password: string,
  salt: Uint8Array,
): Promise<CryptoKey> {
  const encoder = new TextEncoder();

  const passwordKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    {
      name: 'PBKDF2',
    },
    false,
    ['deriveKey'],
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    passwordKey,
    {
      name: 'AES-GCM',
      length: 256,
    },
    false,
    ['encrypt'],
  );
}

async function encryptMessage(
  message: string,
  password: string,
) {
  const encoder = new TextEncoder();

  const salt = crypto.getRandomValues(
    new Uint8Array(SALT_LENGTH),
  );

  const iv = crypto.getRandomValues(
    new Uint8Array(IV_LENGTH),
  );

  /*
   * The password stays inside the browser.
   * It is used to derive the AES encryption key.
   */
  const key = await deriveEncryptionKey(
    password,
    salt,
  );

  /*
   * Plaintext is encrypted before any API request.
   */
  const encrypted = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    encoder.encode(message),
  );

  return {
    ciphertext: bytesToBase64(
      new Uint8Array(encrypted),
    ),
    iv: bytesToBase64(iv),
    salt: bytesToBase64(salt),
    algorithm: 'AES-256-GCM',
    kdf: 'PBKDF2-SHA-256',
    kdfIterations: PBKDF2_ITERATIONS,
  };
}

function getExpirationDate(
  expiry: string,
): string {
  const durations: Record<string, number> = {
    '10-minutes': 10 * 60 * 1000,
    '1-hour': 60 * 60 * 1000,
    '1-day': 24 * 60 * 60 * 1000,
    '7-days': 7 * 24 * 60 * 60 * 1000,
  };

  const duration =
    durations[expiry] ?? durations['1-hour'];

  return new Date(
    Date.now() + duration,
  ).toISOString();
}

function CapsuleForm() {
  const navigate = useNavigate();

  const [message, setMessage] = useState('');
  const [password, setPassword] = useState('');
  const [expiry, setExpiry] = useState('1-hour');

  const [error, setError] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!message.trim()) {
      setError(
        'Please enter some information before creating a capsule.',
      );
      return;
    }

    if (!password.trim()) {
      setError(
        'Please enter a password to protect your capsule.',
      );
      return;
    }

    if (!API_BASE_URL) {
      setError(
        'The API server is not configured.',
      );
      return;
    }

    if (!window.crypto?.subtle) {
      setError(
        'Your browser does not support secure encryption.',
      );
      return;
    }

    setError('');
    setIsCreating(true);

    try {
      /*
       * Encrypt completely in the browser.
       *
       * The following NEVER get sent to the backend:
       * - plaintext message
       * - password
       * - derived encryption key
       */
      const encrypted = await encryptMessage(
        message,
        password,
      );

      /*
       * The selected expiry is converted into the
       * actual expiration timestamp.
       */
      const expiresAt =
        getExpirationDate(expiry);

      const response = await fetch(
        `${API_BASE_URL}/api/capsules`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ciphertext: encrypted.ciphertext,
            iv: encrypted.iv,
            salt: encrypted.salt,
            algorithm: encrypted.algorithm,
            kdf: encrypted.kdf,
            kdfIterations:
              encrypted.kdfIterations,
            expiresAt,
            maxReads: 5,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(
          'Unable to create capsule.',
        );
      }

      /*
       * Expected backend response:
       *
       * {
       *   "id": "abc123"
       * }
       */
      const capsule: CreatedCapsule =
        await response.json();

      if (!capsule.id) {
        throw new Error(
          'The server did not return a capsule identifier.',
        );
      }

      /*
       * Only the capsule ID is passed forward.
       *
       * Password and encryption key are NOT passed.
       */
      navigate('/capsule-created', {
        state: {
          capsuleId: capsule.id,
        },
      });

      /*
       * Clear sensitive values after successful creation.
       */
      setMessage('');
      setPassword('');
    } catch (error) {
      console.error(error);

      if (
        error instanceof Error &&
        error.message ===
          'The server did not return a capsule identifier.'
      ) {
        setError(error.message);
      } else {
        setError(
          'We could not create the capsule. Please try again.',
        );
      }
    } finally {
      setIsCreating(false);
    }
  }

  function handleMessageChange(
    event: React.ChangeEvent<HTMLTextAreaElement>,
  ) {
    setMessage(event.target.value);

    if (error) {
      setError('');
    }
  }

  function handlePasswordChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    setPassword(event.target.value);

    if (error) {
      setError('');
    }
  }

  return (
    <form
      className="capsule-form"
      onSubmit={handleSubmit}
      noValidate
    >
      <div className="form-section">
        <label htmlFor="secret">
          Your sensitive information
        </label>

        <textarea
          id="secret"
          name="secret"
          rows={10}
          maxLength={MAX_CHARACTERS}
          value={message}
          onChange={handleMessageChange}
          placeholder="Write the information you want to share..."
          aria-describedby="secret-help secret-count"
          aria-invalid={Boolean(error)}
          disabled={isCreating}
        />

        <div className="field-meta">
          <p
            id="secret-help"
            className="field-help"
          >
            Your message is encrypted in your browser
            before it is sent to the server.
          </p>

          <p
            id="secret-count"
            className="character-count"
            aria-live="polite"
          >
            {message.length.toLocaleString()} /{' '}
            {MAX_CHARACTERS.toLocaleString()}
          </p>
        </div>
      </div>

      {error && (
        <div
          className="form-error"
          role="alert"
        >
          <AlertCircle
            size={18}
            aria-hidden="true"
          />

          <span>{error}</span>
        </div>
      )}

      <div className="form-grid">
        <div className="form-section">
          <label htmlFor="expiry">
            <Clock3
              size={16}
              aria-hidden="true"
            />

            Expiration
          </label>

          <select
            id="expiry"
            name="expiry"
            value={expiry}
            onChange={(event) =>
              setExpiry(event.target.value)
            }
            disabled={isCreating}
          >
            <option value="10-minutes">
              10 minutes
            </option>

            <option value="1-hour">
              1 hour
            </option>

            <option value="1-day">
              1 day
            </option>

            <option value="7-days">
              7 days
            </option>
          </select>
        </div>

        <div className="form-section">
          <label htmlFor="password">
            <LockKeyhole
              size={16}
              aria-hidden="true"
            />

            Password protection

            <span className="optional-label">
              Required
            </span>
          </label>

          <input
            id="password"
            name="password"
            type="password"
            value={password}
            onChange={handlePasswordChange}
            placeholder="Create a capsule password"
            autoComplete="new-password"
            required
            disabled={isCreating}
          />
        </div>
      </div>

      <div
        className="security-note"
        role="note"
      >
        <ShieldCheck
          size={18}
          aria-hidden="true"
        />

        <div>
          <strong>
            Encrypted in your browser
          </strong>

          <p>
            Your message is protected with
            AES-256-GCM before it leaves your device.
            Your password and encryption key are never
            sent to the server.
          </p>
        </div>
      </div>

      <button
        type="submit"
        className="primary-button create-button"
        disabled={isCreating}
      >
        {isCreating
          ? 'Encrypting & Creating...'
          : 'Create Secure Capsule'}

        <span aria-hidden="true">→</span>
      </button>
    </form>
  );
}
export default CapsuleForm;

