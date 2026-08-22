
# CRIMSON_CODE API Contract

## 1. Purpose

This document defines the initial API contract between the CRIMSON_CODE frontend and
backend.

The purpose is to ensure that frontend and backend development can happen independently
without silently changing the data format during integration.

The API transports encrypted capsule data and required metadata.

> Plaintext and the client-side decryption key must not be sent to the backend.

---

## 2. API Principles

The API follows these principles:

1. The browser performs encryption and decryption.
2. The backend receives ciphertext rather than plaintext.
3. The backend validates all incoming data.
4. The database stores ciphertext and required metadata.
5. API request and response shapes should remain stable once implementation begins.
6. Any breaking API change must be communicated to the team before implementation.

---

## 3. Base API

The backend API will use a versioned base path:

```text
/api
````

The exact deployment URL will depend on the environment.

For example:

```text
https://<backend-host>/api
```

---

# 4. Create Capsule

## POST /api/capsules

Creates a new encrypted capsule.

### Request

```json
{
  "ciphertext": "<encrypted-data>",
  "metadata": {
    "algorithm": "AES-GCM",
    "iv": "<initialization-vector>"
  },
  "expiresAt": "<optional-expiry>"
}
```

### Important security rule

The request must NOT contain:

```text
plaintext
decryptionKey
```

The backend should reject requests that do not satisfy the expected schema.

### Success Response

```json
{
  "id": "<capsule-id>",
  "expiresAt": "<expiry-time>"
}
```

### Possible status codes

```text
201 Created
400 Bad Request
413 Payload Too Large
429 Too Many Requests
500 Internal Server Error
```

---

# 5. Retrieve Capsule

## GET /api/capsules/:id

Retrieves an encrypted capsule.

The backend returns ciphertext and the metadata required by the browser to perform
decryption.

### Example request

```text
GET /api/capsules/abc123
```

### Success Response

```json
{
  "id": "abc123",
  "ciphertext": "<encrypted-data>",
  "metadata": {
    "algorithm": "AES-GCM",
    "iv": "<initialization-vector>"
  },
  "expiresAt": "<expiry-time>"
}
```

The backend does not decrypt the ciphertext.

Decryption is performed by the browser.

### Possible status codes

```text
200 OK
404 Not Found
410 Gone
429 Too Many Requests
500 Internal Server Error
```

`410 Gone` may be used when a capsule existed but is no longer available because of
expiry or a lifecycle rule.

---

# 6. Capsule Lifecycle

Capsules may have lifecycle restrictions such as:

* time-based expiry
* burn-after-reading
* maximum read count

Lifecycle behavior must be enforced by the backend/database rather than relying only
on frontend checks.

For single-use or limited-use capsules, the check and consumption operation must be
atomic.

---

# 7. Delete / Consume Capsule

A separate endpoint for deletion or consumption will only be introduced if the final
lifecycle design requires it.

Possible future design:

```text
DELETE /api/capsules/:id
```

This endpoint is NOT part of the initial required contract.

The team should not implement it until the lifecycle requirements have been finalized.

---

# 8. Error Response Format

API errors should use a consistent structure.

Example:

```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "The request is invalid."
  }
}
```

The backend should not expose:

* database error messages
* stack traces
* internal file paths
* secret values
* cryptographic key material
* unnecessary implementation details

---

# 9. Validation

The backend must validate every request.

Validation should check:

* required fields
* data types
* allowed values
* maximum payload size
* capsule identifier format
* metadata structure
* expiry/lifecycle values

Unexpected fields should be handled according to the backend validation policy.

---

# 10. Security Requirements

The API must satisfy the following requirements.

### Requirement 1 — No plaintext

Plaintext must never be included in API requests.

### Requirement 2 — No decryption key

The client-side decryption key must not be included in API requests.

### Requirement 3 — HTTPS

Production API communication must use HTTPS.

### Requirement 4 — Untrusted input

All request-derived values must be treated as untrusted.

### Requirement 5 — Structured errors

Errors must not expose sensitive internal information.

### Requirement 6 — Size limits

The backend must enforce reasonable request and payload limits.

### Requirement 7 — Lifecycle enforcement

Expiry and single-use/limited-use rules must be enforced server-side where applicable.

---

# 11. Frontend Responsibilities

The frontend is responsible for:

```text
User plaintext
      ↓
Generate/use encryption key
      ↓
Encrypt plaintext
      ↓
Create API request
      ↓
Send ciphertext
```

When retrieving:

```text
Receive ciphertext
      ↓
Use client-side key
      ↓
Decrypt locally
      ↓
Display plaintext
```

The frontend must not send plaintext to the backend.

---

# 12. Backend Responsibilities

The backend is responsible for:

* receiving API requests
* validating requests
* storing ciphertext
* retrieving ciphertext
* enforcing lifecycle rules
* enforcing request limits
* returning structured responses
* handling errors safely

The backend is NOT responsible for decrypting capsule content.

---

# 13. Database Boundary

The backend communicates with PostgreSQL.

Conceptually:

```text
Frontend
   │
   │ ciphertext + metadata
   ▼
Backend
   │
   │ validated data
   ▼
PostgreSQL
```

The database should store:

* capsule identifier
* ciphertext
* required cryptographic metadata
* expiry information
* lifecycle state
* timestamps
* other approved non-secret metadata

The database must not store:

* plaintext
* client-side decryption key

---

# 14. API Change Policy

Once frontend and backend implementation begins, changes to this contract should be
communicated to the team before implementation.

Breaking changes should not be silently introduced.

If an API change is required:

1. Document the proposed change.
2. Inform the affected teammate(s).
3. Update this document.
4. Update the backend.
5. Update the frontend.
6. Test the integration.

---

# 15. Initial Vertical Slice

The first API integration should support:

```text
Browser
   │
   │ POST /api/capsules
   │ ciphertext + metadata
   ▼
Backend
   │
   │ store
   ▼
PostgreSQL


Browser
   │
   │ GET /api/capsules/:id
   ▼
Backend
   │
   │ retrieve
   ▼
PostgreSQL

Backend
   │
   │ ciphertext + metadata
   ▼
Browser
   │
   │ decrypt locally
   ▼
Plaintext
```

This is the minimum end-to-end flow required to demonstrate the core architecture.

---

# 16. Contract Status

Status:

**Initial / Proposed**

This contract should be treated as the working integration contract until the team
finalizes the backend implementation and confirms the exact request and response
schemas.

Any implementation-specific change should be reflected here before the frontend and
backend are integrated.
