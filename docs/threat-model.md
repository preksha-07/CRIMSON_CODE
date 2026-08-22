
# CRIMSON_CODE Threat Model

## 1. Purpose

This threat model identifies what CRIMSON_CODE is protecting, who may attack it, what
those attackers can attempt, and which security properties the system must preserve.

The primary security goal is:

> The server and database should not receive or store the plaintext content or the
> client-side decryption key.

---

## 2. Assets

The main assets we need to protect are:

### High-value assets

- Plaintext capsule content
- Client-side encryption key
- Password-derived key material, where applicable
- Confidentiality of shared information

### Supporting assets

- Capsule identifiers
- Lifecycle information
- Expiry information
- Authentication/integrity data
- Application availability
- User privacy

---

## 3. Trust Boundaries

CRIMSON_CODE has three main components:

```text
┌──────────────────────┐
│       BROWSER        │
│                      │
│ Plaintext            │
│ Encryption key       │
│ Crypto operations    │
└──────────┬───────────┘
           │
           │ HTTPS
           │
───────────┼────────────── TRUST BOUNDARY
           │
┌──────────▼───────────┐
│       BACKEND        │
│                      │
│ API                   │
│ Validation            │
│ Lifecycle enforcement │
└──────────┬───────────┘
           │
           │ Database connection
           │
┌──────────▼───────────┐
│      POSTGRESQL      │
│                      │
│ Ciphertext            │
│ Metadata              │
└──────────────────────┘
````

The browser is the location where plaintext and encryption keys are handled.

The backend and database should only handle ciphertext and the metadata necessary to
operate the service.

---

## 4. Threat Actors

### 4.1 Database attacker

An attacker obtains unauthorized access to the PostgreSQL database.

Potential goal:

* recover plaintext capsule contents

Expected protection:

* stored capsule content is ciphertext
* decryption material is not stored with the ciphertext

---

### 4.2 Network attacker

An attacker attempts to observe or modify communication between the browser and backend.

Potential goals:

* capture sensitive information
* modify requests or responses
* interfere with application communication

Expected protection:

* HTTPS provides encrypted transport
* authenticated encryption protects encrypted capsule data from undetected modification

---

### 4.3 Malicious or compromised server

The server or deployment environment becomes compromised.

Potential goals:

* obtain stored plaintext
* modify application behavior
* serve malicious JavaScript
* manipulate responses

Important limitation:

Client-side encryption does not automatically protect users from malicious JavaScript
being served to their browser.

If malicious application code executes in the browser, it may be able to access plaintext
or encryption keys.

Therefore frontend integrity and deployment security remain important.

---

### 4.4 Attacker with a complete capsule URL

An attacker obtains the complete shareable URL.

Potential goal:

* access the capsule

Security implication:

The URL may contain the client-side information required for decryption.

Therefore possession of the complete URL can provide access to the capsule unless an
additional password or access mechanism is required.

This is a deliberate capability-based access model.

---

### 4.5 Malicious input attacker

An attacker submits specially crafted values to the application.

Examples include:

* malformed JSON
* oversized values
* malicious identifiers
* malicious metadata
* HTML/XSS payloads
* malicious filenames
* unexpected lifecycle values
* specially crafted URL-derived values

Potential goals:

* execute JavaScript
* corrupt application state
* bypass validation
* cause unexpected server behavior
* expose information

Expected protection:

* server-side validation
* strict size/type constraints
* safe rendering
* avoiding direct interpolation of untrusted values
* appropriate security testing

---

### 4.6 Resource-exhaustion attacker

An attacker repeatedly sends expensive or excessive requests.

Potential goals:

* consume server resources
* exhaust database resources
* reduce availability

Expected protection:

* request size limits
* rate limiting
* validation
* appropriate database constraints
* sensible resource limits

---

## 5. Security Properties

CRIMSON_CODE aims to provide the following properties.

### Confidentiality

Plaintext should remain on the client side during normal operation.

The backend and database should receive ciphertext rather than plaintext.

### Integrity

Encrypted data should not be silently modified without detection.

Authenticated encryption such as AES-GCM provides an integrity check for the protected
ciphertext.

### Lifecycle enforcement

Expiry and other lifecycle policies must actually be enforced by the backend.

If a feature promises single-use access or a maximum number of reads, the corresponding
database operation must correctly handle concurrent requests.

### Availability

The application should continue operating under normal expected traffic and reject
obviously abusive or malformed requests.

---

## 6. Threats and Mitigations

| Threat                        | Potential impact                     | Mitigation                                                 |
| ----------------------------- | ------------------------------------ | ---------------------------------------------------------- |
| Database compromise           | Exposure of stored capsule data      | Store ciphertext rather than plaintext                     |
| Network interception          | Exposure/modification of requests    | HTTPS                                                      |
| Malicious JavaScript          | Client-side plaintext/key compromise | Secure deployment, HTTPS, code review, controlled releases |
| Complete URL theft            | Unauthorized capsule access          | Password protection / lifecycle controls where applicable  |
| XSS                           | Plaintext/session compromise         | Safe rendering, validation, security testing               |
| Malformed requests            | Unexpected backend behavior          | Zod validation and strict input checks                     |
| Oversized requests            | Resource exhaustion                  | Request/body size limits                                   |
| ID enumeration                | Unauthorized retrieval attempts      | Unpredictable identifiers and access controls              |
| Lifecycle race condition      | Multiple unauthorized reads          | Atomic database operation                                  |
| Unsafe error handling         | Information disclosure               | Structured errors without internal details                 |
| Unsafe request-derived output | Injection/reflection attacks         | Treat every request-derived string as untrusted            |

---

## 7. Database Compromise Scenario

Consider the following scenario:

```text
Attacker
   │
   ▼
PostgreSQL
   │
   ├── ciphertext
   ├── metadata
   └── lifecycle information
```

The attacker should not directly obtain:

```text
plaintext
encryption key
```

because those values are handled client-side.

However, a database compromise may still expose metadata.

Therefore:

> Client-side encryption reduces the impact of database compromise, but it does not
> make database compromise harmless.

---

## 8. Complete URL Compromise Scenario

Consider:

```text
Attacker obtains complete URL
            ↓
Attacker accesses capsule
```

The security model must acknowledge this possibility.

A complete URL can act as a capability.

Additional protection such as password-derived key material or lifecycle restrictions
can reduce the impact of URL exposure.

---

## 9. Malicious JavaScript Scenario

This is one of the most important limitations of the architecture.

```text
Compromised deployment
        ↓
Modified JavaScript
        ↓
Browser executes malicious code
        ↓
Plaintext / key may be exposed
```

Therefore:

> Client-side encryption protects data from the storage server, but it cannot by itself
> protect the user from malicious code intentionally served by the application.

This means the project must also care about:

* secure deployment
* HTTPS
* dependency management
* code review
* controlled releases
* avoiding unnecessary third-party scripts

---

## 10. Input and Rendering Threat Model

All values entering the system should be considered attacker-controlled.

This includes:

* capsule IDs
* request parameters
* request bodies
* metadata
* filenames
* comments
* nicknames
* URL-derived values
* error-related values

The application must not rely on the assumption that a value is safe because it comes
from an apparently technical part of a request.

The backend should validate inputs before processing them.

The frontend should render untrusted values using safe mechanisms.

---

## 11. Lifecycle Race Conditions

Some lifecycle features require more than a simple conditional check.

For example, consider a capsule that may only be read once:

```text
Request A ──┐
            │
            ├── check remaining_reads
            │
Request B ──┘
```

If both requests check the value before either request modifies it, both may succeed.

Therefore the check and consumption must happen atomically.

Conceptually:

```text
Check condition
      +
Consume resource
      =
ONE atomic database operation
```

The implementation should be tested using concurrent requests before claiming that
single-use behavior is secure.

---

## 12. Out of Scope for the Initial Security Model

The initial implementation does not attempt to protect against every possible threat.

Examples include:

* a compromised user's own device
* malware already running in the user's browser environment
* screenshots or copying of plaintext after decryption
* compromised operating systems
* malicious browser extensions with access to the page
* every possible future attachment-processing vulnerability

These limitations should be documented rather than pretending the system provides
protection that it cannot actually provide.

---

## 13. Security Testing Requirements

Before release, the team should test at minimum:

### Functional security

* plaintext is never sent to the backend
* encryption key is not included in API request bodies
* ciphertext can be retrieved and decrypted correctly
* modified ciphertext fails authentication
* expired capsules cannot be retrieved normally

### Input security

* malformed JSON
* missing fields
* unexpected field types
* oversized payloads
* invalid identifiers
* malicious strings
* XSS payloads

### Lifecycle security

* expired capsule
* already-consumed capsule
* maximum-read-count behavior if implemented
* concurrent read attempts

### API security

* retrieval of nonexistent IDs
* enumeration attempts
* unexpected HTTP methods
* invalid lifecycle values
* excessive request frequency

---

## 14. Security Review Questions

Before calling the system secure enough for the challenge, SCARLET should be able to
answer:

1. Does plaintext ever reach the backend?
2. Does the encryption key ever reach the backend?
3. What exactly is stored in PostgreSQL?
4. What happens if PostgreSQL is compromised?
5. What happens if someone obtains the complete capsule URL?
6. What happens if the frontend JavaScript is compromised?
7. Are all backend inputs validated?
8. Are all request-derived strings treated as untrusted?
9. Can user-controlled data reach HTML unsafely?
10. Are lifecycle operations atomic where required?
11. Are security failures covered by tests?
12. Are the project's security limitations documented honestly?

---

## 15. Security Goal

The primary security goal of CRIMSON_CODE is not to claim that the application is
"perfectly secure."

The goal is to clearly define its security properties, implement them correctly, test
them, and document their limitations.

The most important property is:

> The server stores and transports encrypted data without requiring access to the
> plaintext or client-side decryption key.

Any stronger security claim must be supported by the actual implementation and testing.

