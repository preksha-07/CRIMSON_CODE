# PrivateBin Reconnaissance

## 1. Purpose

PrivateBin is a web application for sharing sensitive text and information while keeping
the actual content hidden from the server. The core idea is that encryption and decryption
happen in the user's browser, while the server stores only encrypted data and the metadata
needed to manage the paste.

PrivateBin therefore addresses a simple problem:

> How can a user share sensitive information through a web service without requiring the
> service itself to know the plaintext?

Our project, CRIMSON_CODE, studies this problem and builds a modern interpretation of it
rather than reproducing PrivateBin's existing implementation or interface.

---

## 2. Basic Architecture

The basic PrivateBin flow can be understood as:

    Browser
       |
       | encrypted data + metadata
       v
    PrivateBin Server
       |
       | storage
       v
    Storage Backend

The important security boundary is between the browser and the server.

### Browser

The browser is responsible for:

- receiving the plaintext from the user
- generating/handling the encryption key
- encrypting the plaintext
- decrypting retrieved ciphertext
- displaying the plaintext to the user

### Server

The server is responsible for:

- receiving encrypted data
- storing the encrypted data
- retrieving encrypted data
- enforcing expiry and other lifecycle rules
- handling requests and responses

The server does not need the plaintext or the decryption key.

### Storage

The storage layer contains the encrypted paste and associated metadata.

The stored content is ciphertext rather than the original plaintext.

---

## 3. What Crosses the Browser → Server Boundary?

The important distinction is between secret content and management data.

### Can cross to the server

- ciphertext
- encryption-related metadata required by the format
- expiry information
- paste identifier
- lifecycle information
- other non-secret metadata

### Must not cross to the server

- plaintext content
- the decryption key contained in the URL fragment

This separation is the foundation of the client-side encryption model.

---

## 4. URL Fragment and the Encryption Key

A URL consists of several components. The fragment is the portion after `#`.

Example:

    https://example.com/paste/abc123#secret-key

The browser does not send the URL fragment to the HTTP server as part of the normal HTTP
request.

PrivateBin uses this property to keep the decryption key away from the server.

Conceptually:

    Paste URL
    ├── Server-visible part
    │     └── identifies the encrypted paste
    │
    └── Fragment
          └── contains the decryption key

Therefore:

1. The sender creates plaintext in the browser.
2. The browser encrypts the plaintext.
3. The ciphertext is sent to the server.
4. The server stores the ciphertext.
5. The URL contains information allowing the recipient's browser to obtain the key.
6. The recipient's browser retrieves the ciphertext.
7. The browser uses the key to decrypt it.

The server does not receive the fragment as part of the normal request.

---

## 5. PrivateBin Threat Model

The main asset being protected is the plaintext shared by users.

### What are we protecting?

- sensitive text
- encryption keys
- user privacy
- confidentiality of stored information

### Who might attack the system?

Potential attackers include:

- an attacker who obtains the stored database
- an attacker who obtains a complete paste URL
- an attacker attempting to tamper with requests
- an attacker attempting to inject malicious content
- a compromised or malicious server operator
- an attacker attempting to exploit unsafe rendering or input handling

### What does the server know?

The server can know information such as:

- that a paste exists
- the paste identifier
- ciphertext
- expiry/lifecycle metadata
- other non-secret metadata required to operate the service
- potentially access-related information depending on deployment/logging

### What must the server not know?

The server should not receive:

- plaintext
- the client-side decryption key

This is the central confidentiality property of the system.

---

## 6. Important Security Assumptions

Client-side encryption does not mean that every part of the system is automatically secure.

PrivateBin's security model depends on the integrity of the JavaScript delivered to the
browser. If an attacker can replace the application's JavaScript with malicious code, that
code could potentially access plaintext or encryption keys in the user's browser.

Therefore:

- HTTPS is important for transport integrity.
- HSTS strengthens HTTPS enforcement.
- The deployed frontend must be treated as part of the security boundary.
- Client-side encryption does not protect a user from malicious application code running
  in their own browser context.

This is an important limitation of the architecture.

---

## 7. What Happens If the Database Leaks?

If an attacker obtains the stored database, the attacker should obtain ciphertext rather
than plaintext.

The intended confidentiality model is therefore:

    Database leak
          |
          v
      ciphertext
          |
          X
      plaintext

Without the required decryption material, the stored ciphertext should not directly reveal
the original content.

However, database confidentiality is not the only security concern. Metadata, identifiers,
expiry information, and access-related information may still be exposed.

---

## 8. What Happens If Someone Gets the Full URL?

Possession of the complete URL is important because the URL contains the information needed
by the browser to obtain the decryption key.

Therefore:

> Possession of the complete link can effectively provide access to the encrypted content,
> unless an additional password or access mechanism is used.

This is a deliberate trade-off in the PrivateBin design.

The system therefore treats the secret URL as a capability.

---

## 9. Encryption Model

PrivateBin uses client-side authenticated encryption.

The conceptual flow is:

    Plaintext
        |
        v
    Encryption
        |
        v
    Ciphertext

The reverse operation is:

    Ciphertext
        |
        v
    Decryption
        |
        v
    Plaintext

The verified PrivateBin format uses AES-256-GCM for encryption.

Its format also uses key-derivation mechanisms involving PBKDF2-HMAC-SHA256, together with
random salt and other cryptographic parameters.

CRIMSON_CODE is not required to reproduce PrivateBin's exact cryptographic format because
the challenge asks for an independent modern implementation.

Instead, CRIMSON_CODE should preserve the important security property:

> Encryption happens in the browser and the server stores ciphertext rather than plaintext.

---

## 10. Encryption vs Hashing

Encryption and hashing solve different problems.

### Encryption

Encryption is reversible with the correct key.

    plaintext + key
          |
          v
      ciphertext

    ciphertext + key
          |
          v
       plaintext

We use encryption because the recipient must eventually recover the original message.

### Hashing

Hashing is designed to be one-way.

    input
      |
      v
    hash

A hash is useful for things such as integrity checks or storing certain credentials safely,
but it is not a replacement for encryption when the original content must be recovered.

---

## 11. AES-GCM Components

AES-GCM provides authenticated encryption.

The important concepts are:

### Encryption key

The key is the secret value used by the encryption/decryption algorithm.

It must not be sent to the server in our client-side encryption model.

### IV / Nonce

The IV is a value used during encryption.

It should be generated appropriately and must not be incorrectly reused with the same key.

The IV does not have to be secret.

### Authentication tag

GCM provides an authentication tag that allows the browser to detect whether the
ciphertext or authenticated data has been modified.

Therefore encryption provides both:

- confidentiality
- integrity/authenticity of the protected data

---

## 12. Configurable PrivateBin Features

PrivateBin provides or supports features including:

- password protection
- paste expiry
- burn-after-reading
- discussions/comments
- Markdown
- syntax highlighting
- attachments
- multiple templates
- internationalization
- multiple storage backends

Each additional feature introduces its own security and usability considerations.

CRIMSON_CODE will not automatically reproduce every feature.

Features will be selected according to:

1. security value
2. user value
3. demonstration value
4. implementation feasibility

---

## 13. Security Lessons From PrivateBin

PrivateBin's security history provides important lessons for CRIMSON_CODE.

The key lesson is that secure cryptography alone is not enough.

Security problems can also arise from:

- unsafe rendering of user-controlled strings
- unsafe file handling
- unsafe filename handling
- insufficient input validation
- incorrect response handling
- unsafe template/path handling
- browser-side injection vulnerabilities

Therefore CRIMSON_CODE must treat incoming data as untrusted throughout the application.

This includes data that may initially appear harmless, such as:

- filenames
- request parameters
- identifiers
- metadata
- user-provided text
- comments or nicknames

---

## 14. Why Attachments Are Not an Initial Priority

File attachments are intentionally not part of the initial core implementation.

The PrivateBin security history demonstrates that attachment and filename handling can create
additional attack surfaces, particularly around browser rendering and content types.

For a short development sprint, the core secure-text-sharing flow provides much more value
than introducing a large attachment-processing surface.

Therefore attachments remain a future extension rather than a core requirement.

---

## 15. PrivateBin vs CRIMSON_CODE

CRIMSON_CODE is not intended to clone PrivateBin's interface or reproduce its code.

The intended approach is:

    Understand the problem
            ↓
    Study the existing architecture
            ↓
    Identify limitations/trade-offs
            ↓
    Design a modern interpretation
            ↓
    Implement independently
            ↓
    Test the security properties

The project should demonstrate that the team understands *why* PrivateBin works rather than
simply copying *what* PrivateBin does.

---

## 16. CRIMSON_CODE Security Boundary

Our intended security boundary is:

    ┌───────────────────────────────┐
    │           BROWSER             │
    │                               │
    │ plaintext                     │
    │ encryption key                │
    │ AES-GCM encryption/decryption │
    └───────────────┬───────────────┘
                    │
                    │ HTTPS
                    │ ciphertext + metadata
                    ▼
    ┌───────────────────────────────┐
    │           BACKEND             │
    │                               │
    │ API                           │
    │ validation                    │
    │ lifecycle/policy enforcement  │
    └───────────────┬───────────────┘
                    │
                    ▼
    ┌───────────────────────────────┐
    │          POSTGRESQL            │
    │                               │
    │ ciphertext + metadata         │
    └───────────────────────────────┘

Plaintext and the decryption key must remain on the client side.

---

## 17. Initial CRIMSON_CODE Goal

The first working vertical slice should be:

    User enters secret
            ↓
    Browser encrypts secret
            ↓
    Ciphertext sent to backend
            ↓
    Backend stores ciphertext
            ↓
    Recipient requests capsule
            ↓
    Ciphertext returned
            ↓
    Browser decrypts
            ↓
    Recipient sees plaintext

The first goal is not to build every feature.

The first goal is to prove that this fundamental security and data-flow model works.

---

## 18. Questions We Must Be Able to Answer

Before final submission, the SCARLET security review should be able to answer:

1. What exactly are we protecting?
2. Who are the relevant attackers?
3. What does the server know?
4. What must never reach the server?
5. Where is encryption performed?
6. Where is decryption performed?
7. Where is the encryption key?
8. Why does the URL fragment matter?
9. What happens if the database is leaked?
10. What happens if someone obtains the complete URL?
11. Why is HTTPS important?
12. What happens if malicious JavaScript is served to the browser?
13. How do we validate untrusted input?
14. How do we prevent XSS?
15. How do we enforce expiry?
16. Which security properties are actually tested?

---

## 19. Reconclusion

PrivateBin demonstrates that secure information sharing can be implemented without requiring
the server to possess the plaintext.

Its most important architectural idea for CRIMSON_CODE is therefore not its UI or its exact
PHP implementation.

It is the separation:

    Client-side secret
            ≠
    Server-side stored ciphertext

CRIMSON_CODE will use this principle as the foundation while redesigning the surrounding
architecture, user experience, lifecycle controls, and security mechanisms for a modern
application.