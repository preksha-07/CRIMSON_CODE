# CRIMSON_CODE Security Review Checklist

## Purpose

This checklist is used by SCARLET — Architecture & Security to review the CRIMSON_CODE
implementation against the documented architecture and threat model.

A requirement should only be marked as verified after the implementation or an
appropriate test provides evidence for it.

---

## 1. Client-Side Cryptography

### Plaintext handling

- [ ] Plaintext is accepted only by the browser.
- [ ] Plaintext is never included in API request bodies.
- [ ] Plaintext is not stored in PostgreSQL.
- [ ] Plaintext is not unnecessarily logged.
- [ ] Plaintext is decrypted in the browser rather than on the backend.

### Encryption

- [ ] Encryption is performed using the Web Crypto API.
- [ ] A standard authenticated-encryption construction is used.
- [ ] AES-GCM is used as specified by the architecture.
- [ ] A fresh, appropriate IV/nonce is generated for each encryption operation.
- [ ] The encryption key is not sent to the backend.
- [ ] Cryptographic operations do not rely on custom implementations of AES or
      other cryptographic primitives.

### Decryption

- [ ] Decryption occurs client-side.
- [ ] Authentication failure causes decryption to fail safely.
- [ ] Modified ciphertext is not accepted as valid plaintext.
- [ ] Decryption errors do not expose sensitive information.

---

## 2. API Security

### Request validation

- [ ] Every API request is validated server-side.
- [ ] Required fields are checked.
- [ ] Data types are checked.
- [ ] Identifier formats are validated.
- [ ] Payload sizes are limited.
- [ ] Lifecycle values are validated.
- [ ] Malformed requests are rejected safely.

### Sensitive data

- [ ] Plaintext is never transmitted to the backend.
- [ ] The client-side encryption key is never transmitted to the backend.
- [ ] Sensitive values are not unnecessarily included in logs.
- [ ] Error responses do not expose secrets or internal implementation details.

### Transport

- [ ] Production browser ↔ backend communication uses HTTPS.
- [ ] HTTP is not used for sensitive production communication.
- [ ] The application does not unnecessarily expose sensitive data through URLs or
      query parameters.

---

## 3. Backend Security

- [ ] All request-derived values are treated as untrusted.
- [ ] Backend validation cannot be bypassed by relying only on frontend validation.
- [ ] Unexpected input is handled safely.
- [ ] Database errors are not directly returned to users.
- [ ] Stack traces are not exposed in production responses.
- [ ] Internal file paths and implementation details are not exposed.
- [ ] Request/body size limits are enforced.
- [ ] Appropriate rate limiting or abuse controls are considered.
- [ ] Unexpected HTTP methods are handled appropriately.

---

## 4. Database Security

- [ ] PostgreSQL stores ciphertext rather than plaintext.
- [ ] The client-side decryption key is not stored in PostgreSQL.
- [ ] Only required metadata is stored.
- [ ] Database queries use safe parameterization/ORM mechanisms.
- [ ] Database credentials are not committed to Git.
- [ ] Database errors are not exposed directly to clients.
- [ ] Lifecycle operations that require atomicity are implemented atomically.

---

## 5. Capsule Access

- [ ] Capsule identifiers are sufficiently unpredictable.
- [ ] Retrieval of a nonexistent capsule is handled safely.
- [ ] Expired capsules cannot be retrieved normally.
- [ ] Lifecycle restrictions are enforced by the backend.
- [ ] Access control assumptions are documented.
- [ ] Complete URL exposure is treated as a security consideration.
- [ ] If password protection is implemented, the password-derived key is not sent to
      the backend.

---

## 6. Lifecycle Security

### Expiry

- [ ] Expiry information is validated.
- [ ] Expired capsules are rejected server-side.
- [ ] Expired data is handled consistently.
- [ ] Expiry cannot be bypassed through frontend manipulation.

### Burn-after-reading / limited reads

If implemented:

- [ ] Read/consume operations are atomic.
- [ ] Concurrent requests cannot bypass the read limit.
- [ ] Already-consumed capsules are rejected.
- [ ] The behavior has been tested with concurrent requests.

---

## 7. Frontend Security

- [ ] User-controlled values are rendered safely.
- [ ] Untrusted strings are not inserted directly into HTML.
- [ ] URL-derived values are treated as untrusted.
- [ ] Error messages do not blindly render attacker-controlled content.
- [ ] User-controlled metadata cannot create an XSS condition.
- [ ] Sensitive plaintext is not unnecessarily persisted in browser storage.
- [ ] Sensitive data is not unnecessarily written to console logs.

---

## 8. XSS / Injection Review

Check all user-controlled values, including:

- [ ] Capsule IDs
- [ ] Metadata
- [ ] User-provided text
- [ ] Filenames, if supported
- [ ] Comments/nicknames, if supported
- [ ] URL-derived values
- [ ] Error-related values

For each value:

- [ ] It is treated as untrusted.
- [ ] It is safely rendered.
- [ ] It is not directly interpolated into HTML.
- [ ] It cannot alter application behavior through injection.

---

## 9. Secrets and Configuration

- [ ] API keys are not committed to Git.
- [ ] Database credentials are not committed to Git.
- [ ] Encryption keys are not hard-coded.
- [ ] `.env` files containing secrets are excluded from Git.
- [ ] Production secrets are provided through appropriate environment configuration.
- [ ] Secrets are not printed in logs.

---

## 10. Dependency and Deployment Security

- [ ] Dependencies are reviewed before use.
- [ ] Unnecessary third-party dependencies are avoided.
- [ ] Dependencies are kept reasonably up to date.
- [ ] Production deployment uses HTTPS.
- [ ] Frontend deployment is controlled.
- [ ] Production configuration does not expose development secrets.
- [ ] CI does not print secrets in logs.

---

## 11. Security Testing

The implementation should provide evidence for:

- [ ] Plaintext is absent from API requests.
- [ ] Encryption key is absent from API requests.
- [ ] Ciphertext can be stored and retrieved.
- [ ] Correct ciphertext decrypts successfully.
- [ ] Modified ciphertext fails authentication.
- [ ] Invalid requests are rejected.
- [ ] Oversized requests are rejected.
- [ ] Expired capsules cannot be retrieved.
- [ ] Lifecycle restrictions work correctly.
- [ ] Concurrent lifecycle operations behave correctly.
- [ ] XSS payloads are rendered safely.
- [ ] Sensitive information is not exposed through errors or logs.

---

## 12. Architecture Consistency

- [ ] Implementation matches `architecture.md`.
- [ ] Implementation matches `api-contract.md`.
- [ ] Implementation matches `threat-model.md`.
- [ ] Client/server security boundary is preserved.
- [ ] Any deviation from the documented architecture is deliberate and documented.
- [ ] Security claims are supported by actual implementation or tests.

---

## 13. Review Result

### Status

- [ ] PASS
- [ ] PASS WITH FINDINGS
- [ ] CHANGES REQUIRED

### Findings

For every finding, record:

1. **Location** — file, function, endpoint, or component.
2. **Issue** — what is wrong.
3. **Impact** — what could happen.
4. **Evidence** — how the issue was identified.
5. **Recommendation** — what should change.
6. **Verification** — how the fix will be tested.

SCARLET should not mark a security requirement as verified merely because the code
appears correct. Where practical, important security properties should be supported by
tests or observable implementation evidence.