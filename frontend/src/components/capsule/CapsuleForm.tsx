
import { useState } from 'react';
import { LockKeyhole, Clock3, AlertCircle } from 'lucide-react';

const MAX_CHARACTERS = 10000;

function CapsuleForm() {
 
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

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

  
  } catch (error) {
    console.error(error);

    setError(
      'We could not create the capsule. Please try again.',
    );
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
  required
          name="secret"
          rows={10}
          maxLength={MAX_CHARACTERS}
          value={message}
          onChange={handleMessageChange}
          placeholder="Write the information you want to share..."
          aria-describedby="secret-help secret-count"
         aria-invalid={Boolean(error)}
aria-errormessage={error ? 'secret-error' : undefined}
        />

        <div className="field-meta">
          <p id="secret-help" className="field-help">
            Keep sensitive information here. You can choose
            how long the capsule remains available below.
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
    id="secret-error"
    className="form-error"
    role="alert"
  >
    <AlertCircle size={18} aria-hidden="true" />
    <span>{error}</span>
  </div>
)}

      <div className="form-grid">
        <div className="form-section">
          <label htmlFor="expiry">
            <Clock3 size={16} aria-hidden="true" />
            Expiration
          </label>

          <select
            id="expiry"
            name="expiry"
            defaultValue="1-hour"
          >
            <option value="10-minutes">10 minutes</option>
            <option value="1-hour">1 hour</option>
            <option value="1-day">1 day</option>
            <option value="7-days">7 days</option>
          </select>
        </div>

        <div className="form-section">
          

          
        </div>
      </div>

      <div className="security-note" role="note">
        <LockKeyhole size={18} aria-hidden="true" />
<input
  id="password"
  name="password"
  type="password"
  placeholder="Add a password"
  autoComplete="new-password"
  aria-describedby="password-help"
/>

<p id="password-help" className="field-help">
  Optional. Add a password if you want an extra layer of protection.
</p>
        <div>
          <strong>Privacy first</strong>

          <p>
            Your message is intended to be encrypted in the
            browser before it is sent to the server.
          </p>
        </div>
      </div>

      <button
        type="submit"
        className="primary-button create-button"
      >
        Create Secure Capsule
        <span aria-hidden="true">→</span>
      </button>
    </form>
  );
}

export default CapsuleForm;