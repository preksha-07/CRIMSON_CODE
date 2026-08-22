
# CRIMSON_CODE Security Test Plan

## 1. Purpose

This document defines the tests used to verify the security properties of CRIMSON_CODE.

The goal is to provide evidence that the implementation matches the architecture and
threat model rather than relying only on code inspection.

---

## 2. Test Categories

Security testing is divided into:

1. Client-side cryptography
2. API security
3. Backend validation
4. Database security
5. Capsule lifecycle
6. Frontend security
7. Error handling
8. Concurrency
9. End-to-end security

---

## 3. Client-Side Cryptography Tests

### Test 3.1 — Plaintext is not sent to the backend

**Objective:** Verify that plaintext never appears in capsule creation requests.

**Procedure:**

1. Open the browser developer tools.
2. Create a capsule containing a recognizable test string.
3. Inspect the network request sent to the backend.
4. Inspect the request body.

**Expected result:**

The plaintext test string does not appear in the request body.

---

### Test 3.2 — Encryption key is not sent to the backend

**Objective:** Verify that the client-side encryption key does not leave the browser.

**Procedure:**

1. Create a capsule.
2. Inspect the API request.
3. Inspect request headers, body, and URL.

**Expected result:**

The encryption key is not transmitted to the backend.

---

### Test 3.3 — Correct ciphertext decrypts successfully

**Objective:** Verify the normal encryption/decryption flow.

**Procedure:**

1. Enter known plaintext.
2. Encrypt it in the browser.
3. Store the resulting capsule.
4. Retrieve the capsule.
5. Decrypt it in the browser.

**Expected result:**

The original plaintext is recovered correctly.

---

### Test 3.4 — Modified ciphertext fails authentication

**Objective:** Verify authenticated encryption integrity.

**Procedure:**

1. Create a valid capsule.
2. Modify the stored or retrieved ciphertext.
3. Attempt client-side decryption.

**Expected result:**

Decryption fails and modified ciphertext is not accepted as valid plaintext.

---

## 4. API Security Tests

### Test 4.1 — Valid capsule creation

**Expected result:**

A valid ciphertext request creates a capsule and returns the expected response.

---

### Test 4.2 — Missing required fields

Send requests with required fields removed.

**Expected result:**

The backend returns a structured `400 Bad Request` response.

---

### Test 4.3 — Invalid field types

Send incorrect data types for expected fields.

Examples:

- string where an object is expected
- object where a string is expected
- invalid expiry value

**Expected result:**

The request is rejected safely.

---

### Test 4.4 — Oversized payload

Send a request exceeding the configured payload limit.

**Expected result:**

The backend rejects the request without excessive resource consumption.

---

### Test 4.5 — Invalid capsule identifier

Attempt to retrieve capsules using malformed identifiers.

**Expected result:**

The backend rejects or safely handles the request.

---

### Test 4.6 — Nonexistent capsule

Request a capsule that does not exist.

**Expected result:**

The API returns the documented not-found response without exposing internal
information.

---

## 5. Backend Security Tests

### Test 5.1 — Backend does not receive plaintext

Inspect backend request handling and network traffic.

**Expected result:**

The backend receives ciphertext and approved metadata only.

---

### Test 5.2 — Backend does not decrypt capsule content

Inspect the backend implementation.

**Expected result:**

The backend has no requirement to possess the client-side decryption key and does not
perform capsule plaintext decryption.

---

### Test 5.3 — Validation cannot be bypassed through the frontend

Send malformed requests directly to the backend rather than through the frontend.

**Expected result:**

The backend independently validates and rejects invalid requests.

---

### Test 5.4 — Internal errors are not exposed

Trigger controlled backend/database failures.

**Expected result:**

The client receives a safe structured error without:

- stack traces
- database errors
- internal paths
- credentials
- implementation details

---

## 6. Database Security Tests

### Test 6.1 — Database contains ciphertext

Inspect a test capsule directly in PostgreSQL.

**Expected result:**

Stored capsule content is ciphertext rather than plaintext.

---

### Test 6.2 — Database does not contain the client-side key

Inspect the relevant database records.

**Expected result:**

The client-side decryption key is not stored in PostgreSQL.

---

### Test 6.3 — Database credentials are not exposed

Inspect repository files and configuration.

**Expected result:**

Database credentials are provided through appropriate environment configuration and
are not committed to Git.

---

## 7. Capsule Lifecycle Tests

### Test 7.1 — Valid capsule before expiry

**Expected result:**

A capsule can be retrieved before its expiry time.

---

### Test 7.2 — Capsule after expiry

**Procedure:**

1. Create a capsule with a short test expiry.
2. Wait until it expires.
3. Attempt retrieval.

**Expected result:**

The backend rejects retrieval according to the documented lifecycle behavior.

---

### Test 7.3 — Frontend cannot bypass expiry

Attempt to manipulate frontend state or expiry-related values.

**Expected result:**

The backend still enforces the actual lifecycle policy.

---

### Test 7.4 — Burn-after-reading

If implemented:

1. Create a single-use capsule.
2. Retrieve it once.
3. Attempt to retrieve it again.

**Expected result:**

The second retrieval is rejected.

---

## 8. Concurrency Tests

These tests are required for lifecycle features involving limited reads.

### Test 8.1 — Concurrent single-use access

**Procedure:**

1. Create a capsule that may only be consumed once.
2. Send two retrieval requests concurrently.
3. Observe both responses.

**Expected result:**

Only the permitted number of requests succeeds.

The implementation must not allow two concurrent requests to bypass the lifecycle
restriction.

---

## 9. Frontend Security Tests

### Test 9.1 — XSS payload rendering

Use a controlled test payload such as:

```text
<script>alert('test')</script>
````

in any user-controlled field that is rendered by the application.

**Expected result:**

The payload is treated as text and does not execute as JavaScript.

---

### Test 9.2 — URL-derived input

Provide unexpected or malicious values through URL parameters or identifiers.

**Expected result:**

The frontend treats URL-derived values as untrusted data.

---

### Test 9.3 — Console/log inspection

Create and retrieve a capsule while monitoring browser and backend logs.

**Expected result:**

Plaintext, encryption keys, and other sensitive values are not unnecessarily logged.

---

## 10. Error Handling Tests

Test at minimum:

* invalid capsule
* expired capsule
* malformed request
* failed decryption
* modified ciphertext
* database failure
* unavailable backend

**Expected result:**

The application displays appropriate user-facing errors without exposing sensitive
internal information.

---

## 11. HTTPS Verification

### Test 11.1 — Production transport

Inspect production network requests.

**Expected result:**

Sensitive browser ↔ backend communication occurs over HTTPS.

---

## 12. Security Regression Tests

Security tests should be repeated after changes affecting:

* encryption
* decryption
* API routes
* request validation
* database operations
* lifecycle logic
* URL handling
* rendering
* authentication or password protection
* deployment configuration

A previously fixed security issue should have a regression test where practical.

---

## 13. Evidence

For significant security properties, record evidence such as:

* automated test results
* network inspection
* database inspection
* code location
* screenshots where appropriate
* reproduction steps for security findings

A security requirement should not be marked as verified solely because someone
believes the implementation is correct.

---

## 14. Test Result Format

For each security test, record:

| Field       | Description                                |
| ----------- | ------------------------------------------ |
| Test ID     | Unique test identifier                     |
| Status      | PASS / FAIL / BLOCKED                      |
| Environment | Where the test was performed               |
| Evidence    | Test output, code location, or observation |
| Finding     | Problem discovered, if any                 |
| Severity    | Impact level                               |
| Follow-up   | Required fix or verification               |

---

## 15. Release Security Gate

Before the first production release, the following must be verified:

* [ ] Plaintext is not sent to the backend.
* [ ] Client-side encryption key is not sent to the backend.
* [ ] Ciphertext is stored instead of plaintext.
* [ ] Modified ciphertext fails authentication.
* [ ] Backend input validation works independently of the frontend.
* [ ] Expiry is enforced server-side.
* [ ] Lifecycle operations are atomic where required.
* [ ] XSS/security rendering tests pass.
* [ ] Sensitive information is not exposed through errors or logs.
* [ ] Production communication uses HTTPS.
* [ ] Secrets are not committed to the repository.

---

## 16. Test Status

Status:

**Planned**

Tests will be marked as PASS, FAIL, or BLOCKED only after the relevant implementation
exists and the test has actually been performed.

