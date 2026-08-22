
# CRIMSON_CODE Architecture

## 1. Architecture Overview

CRIMSON_CODE uses a client-server architecture with three primary layers:

1. Browser / Frontend
2. Backend / API
3. PostgreSQL Database

The architecture is designed around one central security principle:

> The browser handles plaintext and encryption keys. The backend and database handle ciphertext and non-secret metadata.

```text
┌──────────────────────────────┐
│           BROWSER            │
│                              │
│ React + TypeScript           │
│ Web Crypto API               │
│                              │
│ Plaintext                    │
│ Encryption / Decryption      │
│ Encryption Key               │
└──────────────┬───────────────┘
               │
               │ HTTPS
               │
               │ ciphertext
               │ metadata
               ▼
┌──────────────────────────────┐
│           BACKEND            │
│                              │
│ Fastify + TypeScript         │
│                              │
│ API routes                   │
│ Input validation             │
│ Lifecycle / policy checks    │
│ Error handling               │
└──────────────┬───────────────┘
               │
               │ database queries
               ▼
┌──────────────────────────────┐
│         POSTGRESQL           │
│                              │
│ Ciphertext                   │
│ Capsule metadata             │
│ Expiry / lifecycle state     │
└──────────────────────────────┘
````

---

## 2. Frontend / Browser

The frontend is responsible for the user-facing application.

### Main responsibilities

* Provide the capsule creation interface.
* Accept plaintext from the user.
* Generate or handle encryption keys.
* Encrypt plaintext before transmission.
* Send ciphertext to the backend.
* Retrieve ciphertext from the backend.
* Decrypt ciphertext locally.
* Display decrypted plaintext to the user.
* Display lifecycle and error states.

### Technologies

* React
* TypeScript
* Vite
* Web Crypto API

The Web Crypto API is used instead of implementing cryptographic algorithms manually.

---

## 3. Backend / API

The backend provides the controlled interface between the frontend and database.

### Main responsibilities

* Receive API requests.
* Validate incoming data.
* Store encrypted capsule data.
* Retrieve encrypted capsule data.
* Enforce expiry and lifecycle policies.
* Return structured responses.
* Handle errors safely.
* Apply appropriate limits and protections.

### Technologies

* Node.js
* Fastify
* TypeScript
* Zod for input validation

The backend must treat all request-derived data as untrusted.

It must not assume that a value is safe simply because it is an identifier, filename,
metadata field, URL component, or other apparently technical value.

---

## 4. Database

PostgreSQL is used as the persistent storage layer.

The database stores encrypted capsule information rather than plaintext.

A conceptual capsule record may contain:

* capsule ID
* ciphertext
* encryption-related metadata required by the client
* expiry information
* lifecycle information
* creation timestamp
* other non-secret metadata

The exact schema will be finalized during backend implementation.

### Important rule

The database should never contain the plaintext secret or the client-side decryption key.

---

## 5. Data Flow: Creating a Capsule

The creation flow is:

```text
1. User enters plaintext
          ↓
2. Browser generates/uses encryption key
          ↓
3. Browser encrypts plaintext
          ↓
4. Browser produces ciphertext
          ↓
5. Browser sends ciphertext + required metadata
   to backend over HTTPS
          ↓
6. Backend validates request
          ↓
7. Backend stores ciphertext + metadata
   in PostgreSQL
          ↓
8. Backend returns capsule information
          ↓
9. Browser constructs the shareable capsule URL
```

At no point during this flow should the plaintext be sent to the backend.

---

## 6. Data Flow: Retrieving a Capsule

The retrieval flow is:

```text
1. Recipient opens capsule URL
          ↓
2. Browser obtains the capsule identifier
   and client-side key information
          ↓
3. Browser requests the capsule from backend
          ↓
4. Backend retrieves ciphertext
          ↓
5. Backend returns ciphertext + required metadata
          ↓
6. Browser uses its key to decrypt locally
          ↓
7. Plaintext is displayed to the recipient
```

The backend participates in retrieval but does not need to decrypt the capsule.

---

## 7. Security Boundary

The most important boundary is:

```text
                 TRUST BOUNDARY
                       │
                       ▼
┌──────────────────────┐      HTTPS      ┌──────────────────────┐
│       BROWSER        │ ──────────────► │       BACKEND        │
│                      │                 │                      │
│ plaintext            │                 │ ciphertext           │
│ encryption key       │                 │ metadata             │
│ encryption/decryption│                 │ lifecycle enforcement│
└──────────────────────┘                 └──────────┬───────────┘
                                                    │
                                                    ▼
                                           ┌──────────────────┐
                                           │    POSTGRESQL    │
                                           │                  │
                                           │ ciphertext       │
                                           │ metadata         │
                                           └──────────────────┘
```

### Browser-side secrets

The browser handles:

* plaintext
* encryption key
* decrypted plaintext

### Server-side data

The backend/database handle:

* ciphertext
* capsule identifiers
* lifecycle metadata
* expiry information
* other non-secret metadata

This separation is the core confidentiality property of the architecture.

---

## 8. Why We Use an API Boundary

The frontend and backend communicate through an explicit API.

This gives the project a clear separation of responsibilities:

```text
Frontend
    │
    │ HTTP/HTTPS API
    ▼
Backend
    │
    │ Database operations
    ▼
PostgreSQL
```

The API contract should be defined before the frontend and backend are fully integrated.

This allows:

* frontend development against predictable response shapes
* backend development independently of the UI
* easier testing
* easier integration
* clearer security review
* clearer documentation

---

## 9. Contract-First Development

The frontend and backend should agree on:

* endpoint names
* HTTP methods
* request fields
* response fields
* data types
* success status codes
* error status codes

before integration.

For example:

```text
POST /capsules

Request:
{
    ciphertext: "...",
    metadata: "..."
}

Response:
{
    id: "...",
    expiresAt: "..."
}
```

The exact contract will be finalized by the team before the real frontend/backend
integration.

The important rule is:

> Do not silently change the API shape while another teammate is building against it.

---

## 10. Lifecycle Enforcement

CRIMSON_CODE may support lifecycle policies such as:

* time-based expiry
* burn-after-reading
* maximum read count

Time-based expiry is the initial lifecycle requirement.

For features involving read counts or consumption, the backend/database operation must
be atomic.

For example:

```text
Request A ──┐
            ├── atomic check + consume
Request B ──┘
```

The system must prevent two concurrent requests from incorrectly consuming the same
single-use capsule.

Such a feature should only be considered complete after the behavior has been tested.

---

## 11. Error Handling

Errors should be handled deliberately at every layer.

### Frontend

The frontend should provide appropriate states for:

* loading
* invalid capsule
* expired capsule
* failed retrieval
* failed decryption
* incorrect password, if password protection is implemented

### Backend

The backend should:

* validate input
* reject malformed requests
* avoid exposing unnecessary internal details
* return structured errors
* avoid reflecting untrusted request data unsafely

### Database

Database errors should not be directly exposed to users.

---

## 12. Input Validation

Every value received by the backend is considered untrusted.

Validation should cover:

* required fields
* data types
* allowed sizes
* identifiers
* metadata
* lifecycle values

Validation is a security boundary as well as a correctness mechanism.

---

## 13. Rendering Security

CRIMSON_CODE must not directly insert untrusted strings into HTML or the DOM.

Particular attention should be paid to:

* user-provided text
* filenames
* metadata
* identifiers
* URL-derived values
* error messages
* comments/nicknames if those features are implemented

The application should use safe rendering mechanisms and appropriate sanitization where
rich content is intentionally supported.

---

## 14. Deployment Architecture

The intended deployment architecture is:

```text
                 Internet
                    │
          ┌─────────┴─────────┐
          │                   │
          ▼                   ▼
     Frontend Host       Backend Host
     React/Vite          Fastify API
                              │
                              ▼
                         PostgreSQL
```

HTTPS must be used for communication between the browser and backend.

Environment-specific configuration and secrets must not be committed to Git.

---

## 15. Architectural Non-Goals

The initial architecture does not attempt to provide:

* a general-purpose file storage platform
* a social network
* full user-account management
* unrestricted collaboration
* arbitrary attachment processing

These features can introduce additional security and implementation complexity.

The first priority is secure encrypted information sharing.

---

## 16. Architecture Decision

CRIMSON_CODE will initially use:

| Layer               | Technology                     |
| ------------------- | ------------------------------ |
| Frontend            | React + TypeScript + Vite      |
| Client cryptography | Web Crypto API                 |
| Backend             | Node.js + Fastify + TypeScript |
| Validation          | Zod                            |
| Database            | PostgreSQL                     |
| API communication   | HTTP/HTTPS                     |
| Testing             | Vitest + Playwright            |
| CI                  | GitHub Actions                 |

The architecture may be simplified if the team encounters significant integration or
deployment problems, but any such change should be deliberate and documented.

---

## 17. Definition of the First Vertical Slice

The architecture is considered to have its first meaningful implementation when this
complete flow works:

```text
Create
  ↓
Encrypt in Browser
  ↓
Send Ciphertext
  ↓
Store in PostgreSQL
  ↓
Retrieve Ciphertext
  ↓
Decrypt in Browser
  ↓
Display Plaintext
```

This vertical slice is more important than adding many independent features.

Once it works reliably, additional lifecycle, security, and UX features can be added
without losing the core architecture.


