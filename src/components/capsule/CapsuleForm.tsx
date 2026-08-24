import { useState } from 'react';
import { AlertCircle, Eye, EyeOff, LockKeyhole, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const PBKDF2_ITERATIONS = 310000;

type ExpiryOption = '1h' | '6h' | '24h' | '7d';

interface EncryptedMessage {
  ciphertext: string;
  iv: string;
  salt: string;
  algorithm: string;
  kdf: string;
  kdfIterations: number;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';

  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }

  return btoa(binary);
}

function getExpiryDate(option: ExpiryOption): string {
  const now = new Date();

  const durationMap: Record<ExpiryOption, number> = {
    '1h': 60 * 60 * 1000,
    '6h': 6 * 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
  };

  return new Date(
    now.getTime() + durationMap[option],
  ).toISOString();
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
): Promise<EncryptedMessage> {
  const encoder = new TextEncoder();

  const salt = crypto.getRandomValues(
    new Uint8Array(16),
  );

  const iv = crypto.getRandomValues(
    new Uint8Array(12),
  );

  const key = await deriveEncryptionKey(
    password,
    salt,
  );

  const encryptedBuffer =
    await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      key,
      encoder.encode(message),
    );

  return {
    ciphertext: bytesToBase64(
      new Uint8Array(encryptedBuffer),
    ),
    iv: bytesToBase64(iv),
    salt: bytesToBase64(salt),
    algorithm: 'AES-GCM',
    kdf: 'PBKDF2',
    kdfIterations: PBKDF2_ITERATIONS,
  };
}

function CapsuleForm() {
  const navigate = useNavigate();

  const [message, setMessage] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] =
    useState(false);
  const [expiry, setExpiry] =
    useState<ExpiryOption>('1h');

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] =
    useState(false);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!message.trim()) {
      setError('Please enter a secret message.');
      return;
    }

    if (!password.trim()) {
      setError('Please create a capsule password.');
      return;
    }

    if (!API_BASE_URL) {
      setError(
        'API configuration is missing. Please check your .env file.',
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
    setIsSubmitting(true);

    try {
      /*
       * IMPORTANT:
       *
       * The plaintext message and password never go
       * into the API request.
       *
       * Encryption happens completely inside the browser.
       */
      const encrypted = await encryptMessage(
        message,
        password,
      );

      const expiresAt = getExpiryDate(expiry);

      /*
       * The backend contract expects:
       *
       * ciphertext
       * metadata
       * expiresAt
       * maxReads
       *
       * All cryptographic metadata is intentionally
       * stored inside metadata so RetrieveCapsule can
       * read capsule.metadata consistently.
       */
      const response = await fetch(
        `${API_BASE_URL}/api/capsules`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            ciphertext: encrypted.ciphertext,

            metadata: {
              iv: encrypted.iv,
              salt: encrypted.salt,
              algorithm: encrypted.algorithm,
              kdf: encrypted.kdf,
              kdfIterations:
                encrypted.kdfIterations,
            },

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

      const data = await response.json();

      /*
       * The backend must return the newly created
       * capsule identifier.
       */
      if (!data.capsuleId) {
        throw new Error(
          'The backend did not return a capsule ID.',
        );
      }

      /*
       * The password and encryption key are NOT
       * passed through navigation state.
       *
       * Only the backend-generated capsule ID is
       * required for the created page.
       */
      navigate('/capsule-created', {
        state: {
          capsuleId: data.capsuleId,
        },
      });
    } catch (submitError) {
      console.error(submitError);

      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Something went wrong while creating the capsule.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="create-page">
      <section className="create-hero">
        <div className="page-glow page-glow-one" />
        <div className="page-glow page-glow-two" />

        <div className="create-card">
          <div className="create-icon">
            <LockKeyhole size={30} />
          </div>

          <span className="eyebrow">
            CREATE CAPSULE
          </span>

          <h1>
            Keep it private.
            <br />
            <span>Keep it temporary.</span>
          </h1>

          <p className="create-description">
            Your message is encrypted in your browser
            before anything is sent to the server.
          </p>

          <form
            className="capsule-form"
            onSubmit={handleSubmit}
            noValidate
          >
            <div className="form-group">
              <label htmlFor="secret-message">
                Secret message
              </label>

              <textarea
                id="secret-message"
                value={message}
                onChange={(event) => {
                  setMessage(event.target.value);
                  setError('');
                }}
                placeholder="Write the message you want to protect..."
                rows={7}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="form-group">
              <label htmlFor="capsule-password">
                <LockKeyhole size={16} />
                Capsule password
              </label>

              <div className="password-wrapper">
                <input
                  id="capsule-password"
                  type={
                    showPassword
                      ? 'text'
                      : 'password'
                  }
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setError('');
                  }}
                  placeholder="Create a password"
                  autoComplete="new-password"
                  required
                  disabled={isSubmitting}
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowPassword(
                      !showPassword,
                    )
                  }
                  aria-label={
                    showPassword
                      ? 'Hide password'
                      : 'Show password'
                  }
                  disabled={isSubmitting}
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="expiry">
                Capsule lifetime
              </label>

              <select
                id="expiry"
                value={expiry}
                onChange={(event) =>
                  setExpiry(
                    event.target.value as ExpiryOption,
                  )
                }
                disabled={isSubmitting}
              >
                <option value="1h">
                  1 hour
                </option>

                <option value="6h">
                  6 hours
                </option>

                <option value="24h">
                  24 hours
                </option>

                <option value="7d">
                  7 days
                </option>
              </select>
            </div>

            {error && (
              <div
                className="form-error"
                role="alert"
              >
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="primary-button"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? 'Encrypting...'
                : 'Create Secure Capsule'}

              <span aria-hidden="true">
                →
              </span>
            </button>
          </form>

          <div className="create-note">
            <ShieldCheck size={17} />

            <span>
              Your message is encrypted locally.
              Your password and encryption key are
              never sent to the server.
            </span>
          </div>
        </div>
      </section>
    </main>
  );
}

export default CapsuleForm;