
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  AlertCircle,
  Check,
  Copy,
  Eye,
  EyeOff,
  LockKeyhole,
  ShieldCheck,
} from 'lucide-react';

const PBKDF2_ITERATIONS = 310000;

interface CapsuleResponse {
  ciphertext: string;
  iv: string;
  salt: string;
  algorithm?: string;
  kdf?: string;
  kdfIterations?: number;
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);

  return Uint8Array.from(
    binary,
    (character) => character.charCodeAt(0),
  );
}

async function deriveDecryptionKey(
  password: string,
  salt: Uint8Array,
  iterations: number,
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
  iv: string,
  salt: string,
  password: string,
  iterations: number,
): Promise<string> {
  const ciphertextBytes = base64ToBytes(ciphertext);
  const ivBytes = base64ToBytes(iv);
  const saltBytes = base64ToBytes(salt);

  const key = await deriveDecryptionKey(
    password,
    saltBytes,
    iterations,
  );

  const decrypted = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: ivBytes,
    },
    key,
    ciphertextBytes,
  );

  return new TextDecoder().decode(decrypted);
}

function RetrieveCapsule() {
  const { id } = useParams<{ id: string }>();

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [secretMessage, setSecretMessage] =
    useState('');

  const [error, setError] = useState('');
  const [isRetrieving, setIsRetrieving] =
    useState(false);

  const [copied, setCopied] = useState(false);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!id) {
      setError(
        'This capsule link is missing its identifier.',
      );
      return;
    }

    if (!password.trim()) {
      setError(
        'Please enter the capsule password.',
      );
      return;
    }

    setError('');
    setIsRetrieving(true);

    try {
      /*
       * IMPORTANT:
       * The password is NOT sent to the backend.
       *
       * The backend only receives the capsule identifier
       * through the URL. The encrypted capsule data is
       * retrieved first, then decryption happens locally.
       */
      const response = await fetch(
        `http://localhost:3000/api/capsules/${encodeURIComponent(id)}`,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
          },
        },
      );

      if (response.status === 404) {
        throw new Error(
          'CAPSULE_NOT_FOUND',
        );
      }

      if (response.status === 410) {
        throw new Error(
          'CAPSULE_UNAVAILABLE',
        );
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
        !capsule.iv ||
        !capsule.salt
      ) {
        throw new Error(
          'Invalid capsule encryption data.',
        );
      }

      /*
       * The key is derived locally from the password.
       *
       * Neither the password nor the derived key is
       * transmitted to the backend.
       */
      const plaintext = await decryptMessage(
        capsule.ciphertext,
        capsule.iv,
        capsule.salt,
        password,
        capsule.kdfIterations ??
          PBKDF2_ITERATIONS,
      );

      setSecretMessage(plaintext);
      setPassword('');
    } catch (error) {
      console.error(error);

      if (
        error instanceof Error &&
        error.message === 'CAPSULE_NOT_FOUND'
      ) {
        setError(
          'This capsule could not be found.',
        );
      } else if (
        error instanceof Error &&
        error.message === 'CAPSULE_UNAVAILABLE'
      ) {
        setError(
          'This capsule has expired or reached its maximum number of reads.',
        );
      } else {
        /*
         * AES-GCM authentication fails when the password
         * is incorrect or the encrypted data was modified.
         */
        setError(
          'The password is incorrect or the capsule could not be decrypted.',
        );
      }
    } finally {
      setIsRetrieving(false);
    }
  }

  async function handleCopy() {
    if (!secretMessage) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        secretMessage,
      );

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error(
        'Could not copy message:',
        error,
      );
    }
  }

  return (
    <main className="retrieve-page">
      <section className="retrieve-hero">
        <div className="page-glow page-glow-one" />
        <div className="page-glow page-glow-two" />

        <div className="retrieve-card">
          {!secretMessage ? (
            <>
              <div className="retrieve-icon">
                <LockKeyhole
                  size={32}
                  aria-hidden="true"
                />
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
                This capsule is password protected.
                Enter the password provided by the
                sender to retrieve the information.
              </p>

              <form
                className="retrieve-form"
                onSubmit={handleSubmit}
                noValidate
              >
                <label htmlFor="capsule-password">
                  <LockKeyhole
                    size={16}
                    aria-hidden="true"
                  />

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
                      setPassword(
                        event.target.value,
                      );

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
                  >
                    {showPassword ? (
                      <EyeOff
                        size={18}
                        aria-hidden="true"
                      />
                    ) : (
                      <Eye
                        size={18}
                        aria-hidden="true"
                      />
                    )}
                  </button>
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
                <ShieldCheck
                  size={17}
                  aria-hidden="true"
                />

                <span>
                  Your password never leaves your
                  browser. Decryption happens locally.
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="retrieve-icon secret-success">
                <Check
                  size={32}
                  aria-hidden="true"
                />
              </div>

              <span className="eyebrow">
                CAPSULE UNLOCKED
              </span>

              <h1>
                Your secret is
                <br />
                <span>ready to view.</span>
              </h1>

              <p className="retrieve-description">
                The capsule was successfully
                decrypted in your browser.
              </p>

              <div className="retrieved-message">
                <div className="retrieved-message-header">
                  <span>SECURE MESSAGE</span>

                  <LockKeyhole
                    size={17}
                    aria-hidden="true"
                  />
                </div>

                <p>{secretMessage}</p>

                <button
                  type="button"
                  className="secret-copy-button"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <>
                      <Check size={16} />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy size={16} />
                      Copy Message
                    </>
                  )}
                </button>
              </div>

              <div
                className="retrieve-note"
                role="note"
              >
                <ShieldCheck
                  size={17}
                  aria-hidden="true"
                />

                <span>
                  The decrypted message exists only
                  in your browser session.
                </span>
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
}

export default RetrieveCapsule;

