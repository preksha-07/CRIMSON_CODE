import { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  LockKeyhole,
  ShieldCheck,
} from 'lucide-react';

const MAX_CHARACTERS = 10000;

function CapsuleForm() {
  const [message, setMessage] = useState('');
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

    setError('');
    setIsCreating(true);

    try {
      const response = await fetch(
        'http://localhost:3000/api/capsules',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ciphertext: 'TEMPORARY_ENCRYPTED_VALUE',
            expiresAt: new Date(
              Date.now() + 60 * 60 * 1000,
            ).toISOString(),
            maxReads: 5,
          }),
        },
      );

      if (!response.ok) {
        throw new Error('Unable to create capsule.');
      }

      const capsule = await response.json();

      console.log('Capsule created:', capsule);

      // Backend integration/navigation can be connected
      // by your team later.
    } catch (error) {
      console.error(error);

      setError(
        'We could not create the capsule. Please try again.',
      );
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

  return (
    <form
      className="capsule-form premium-capsule-form"
      onSubmit={handleSubmit}
      noValidate
    >
      {/* MESSAGE */}
      <div className="form-section animated-form-section">
        <div className="form-heading">
          <div>
            <label htmlFor="secret">
              Your sensitive information
            </label>

            <p className="form-subtitle">
              Write the information you want to share securely.
            </p>
          </div>

          <ShieldCheck
            size={21}
            aria-hidden="true"
          />
        </div>

        <div
          className={`textarea-wrapper ${
            message ? 'has-content' : ''
          }`}
        >
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
          />

          <div className="textarea-bottom">
            <p id="secret-help" className="field-help">
              Your message will be placed inside a capsule.
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
      </div>

      {/* ERROR */}
      {error && (
        <div className="form-error animated-error" role="alert">
          <AlertCircle
            size={18}
            aria-hidden="true"
          />

          <span>{error}</span>
        </div>
      )}

      {/* SETTINGS */}
      <div className="form-grid premium-form-grid">
        <div className="form-section animated-form-section">
          <label htmlFor="expiry">
            <Clock3 size={16} aria-hidden="true" />
            Expiration
          </label>

          <select
            id="expiry"
            name="expiry"
            defaultValue="1-hour"
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

        <div className="form-section animated-form-section">
          <label htmlFor="password">
            <LockKeyhole
              size={16}
              aria-hidden="true"
            />

            Password protection

            

<span className="required-label">
  Required
</span>
          </label>

          <input
            id="password"
            name="password"
            type="password"
            placeholder="Add a password"
            autoComplete="new-password"
          />
        </div>
      </div>

      {/* SECURITY NOTE */}
      <div className="security-note premium-security-note" role="note">
        <div className="security-note-icon">
          <LockKeyhole
            size={19}
            aria-hidden="true"
          />
        </div>

        <div>
          <strong>Privacy first</strong>

          <p>
            Your message is intended to be encrypted in
            the browser before it is sent to the server.
          </p>
        </div>

        <CheckCircle2
          size={18}
          aria-hidden="true"
          className="security-check"
        />
      </div>

      {/* SUBMIT */}
      <button
        type="submit"
        className={`primary-button create-button premium-create-button ${
          isCreating ? 'is-creating' : ''
        }`}
        disabled={isCreating}
      >
        {isCreating ? (
          <>
            <span className="button-spinner" />
            Creating capsule...
          </>
        ) : (
          <>
            Create Secure Capsule
            <span aria-hidden="true">→</span>
          </>
        )}
      </button>
    </form>
  );
}

export default CapsuleForm;