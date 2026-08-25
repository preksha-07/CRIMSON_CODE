import { useState } from 'react';
import {
  AlertCircle,
  Eye,
  EyeOff,
  LockKeyhole,
  ShieldCheck,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL;

const PBKDF2_ITERATIONS = 310000;

interface CapsuleMetadata {
  iv: string;
  salt: string;
  algorithm?: string;
  kdf?: string;
  kdfIterations?: number;
}

interface CapsuleResponse {
  ciphertext: string;
  metadata: CapsuleMetadata;
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}

function toArrayBuffer(
  bytes: Uint8Array,
): ArrayBuffer {
  const buffer = new ArrayBuffer(bytes.byteLength);

  new Uint8Array(buffer).set(bytes);

  return buffer;
}

async function deriveDecryptionKey(
  password: string,
  salt: Uint8Array,
  iterations: number,
): Promise<CryptoKey> {
  const encoder = new TextEncoder();

  const passwordKey =
    await crypto.subtle.importKey(
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
      salt: toArrayBuffer(salt),
      iterations,
      hash: 'SHA-256',
    },
    passwordKey,
    {
      name: 'AES-GCM',
      length: 256,
    },
    false,
    ['decrypt'],
  );
}

async function decryptMessage(
  ciphertext: string,
  metadata: CapsuleMetadata,
  password: string,
): Promise<string> {
  if (!metadata?.iv || !metadata?.salt) {
    throw new Error(
      'Capsule encryption metadata is missing.',
    );
  }

  const iv = base64ToBytes(metadata.iv);
  const salt = base64ToBytes(metadata.salt);

  const iterations =
    metadata.kdfIterations ?? PBKDF2_ITERATIONS;

  const key = await deriveDecryptionKey(
    password,
    salt,
    iterations,
  );

  const encryptedData =
    base64ToBytes(ciphertext);

  const decrypted =
  await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: toArrayBuffer(iv),
    },
    key,
    toArrayBuffer(encryptedData),
  );

  return new TextDecoder().decode(decrypted);
}

function RetrieveCapsule() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] =
    useState(false);
  const [error, setError] = useState('');
  const [isRetrieving, setIsRetrieving] =
    useState(false);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!id) {
      setError(
        'The capsule identifier is missing.',
      );
      return;
    }

    if (!password.trim()) {
      setError(
        'Please enter the capsule password.',
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
        'Your browser does not support secure decryption.',
      );
      return;
    }

    setError('');
    setIsRetrieving(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/capsules/${encodeURIComponent(id)}`,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
          },
        },
      );

      /*
       * 404 = capsule does not exist.
       * 410 = capsule expired or reached max reads.
       *
       * Both should show the unavailable page.
       */
      if (
        response.status === 404 ||
        response.status === 410
      ) {
        navigate('/capsule-unavailable');
        return;
      }

      if (!response.ok) {
        throw new Error(
          'Unable to retrieve capsule.',
        );
      }

      const capsule: CapsuleResponse =
        await response.json();

      if (
        !capsule.ciphertext ||
        !capsule.metadata
      ) {
        throw new Error(
          'The capsule data is incomplete.',
        );
      }

      /*
       * IMPORTANT:
       *
       * Crypto metadata is read from capsule.metadata.
       *
       * This matches the create API contract.
       */
      const decryptedMessage =
        await decryptMessage(
          capsule.ciphertext,
          capsule.metadata,
          password,
        );

      /*
       * Only successfully decrypted plaintext
       * is sent to SecretRevealed.
       *
       * The password is NOT sent.
       * The encryption key is NOT sent.
       */
      navigate('/secret-revealed', {
        state: {
          message: decryptedMessage,
        },
      });
    } catch (retrieveError) {
      console.error(retrieveError);

      setError(
        'Unable to unlock the capsule. Please check the password and try again.',
      );
    } finally {
      setIsRetrieving(false);
    }
  }

  return (
    <main className="retrieve-page">
      <section className="retrieve-hero">
        <div className="page-glow page-glow-one" />
        <div className="page-glow page-glow-two" />

        <div className="retrieve-card">
          <div className="retrieve-icon">
            <LockKeyhole size={32} />
          </div>

          <span className="eyebrow">
            SECURE CAPSULE
          </span>

          <h1>
            Unlock the
            <br />
            <span>capsule.</span>
          </h1>

          <p className="retrieve-description">
            This capsule is password protected. Enter
            the password provided by the sender to
            retrieve the information.
          </p>

          <form
            className="retrieve-form"
            onSubmit={handleSubmit}
            noValidate
          >
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
                placeholder="Enter password"
                autoComplete="off"
                required
                disabled={isRetrieving}
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
                disabled={isRetrieving}
              >
                {showPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
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
              className="primary-button retrieve-button"
              disabled={isRetrieving}
            >
              {isRetrieving
                ? 'Decrypting...'
                : 'Unlock Capsule'}

              <span aria-hidden="true">
                →
              </span>
            </button>
          </form>

          <div className="retrieve-note">
            <ShieldCheck size={17} />

            <span>
              Your password stays in your browser.
              Decryption happens locally before the
              secret is displayed.
            </span>
          </div>
        </div>
      </section>
    </main>
  );
}

export default RetrieveCapsule;