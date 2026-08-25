# Crimson Code - Testing Status & Specifications

This document outlines the scope, configuration, and architecture coverage of the Crimson Code testing system.

---

## 1. What's Currently Tested

### Backend API Tests (Vitest)
- **Health API:** Checks `GET /api/health` status and schema.
- **Capsule Schema Validation:** Asserts validation errors (`400`) on empty, missing, invalid expiration (past/non-ISO), and incorrect `maxReads` inputs.
- **Payload Boundaries:** Separately tests global request body limits (`413` for body > 2MB) and Zod schema validation boundaries (exactly 1.5M chars succeeds; 1.5M + 1 char fails with `400`).
- **Capsule Retrieval:** Checks retrieval of active, expired (`410`), exhausted (`410`), nonexistent (`404`), and unlimited-use capsules.
- **CORS Policies:** Verifies allowed local origins and blockages of arbitrary external origins.
- **Rate Limiting:** Asserts `429` Rate Limit Exceeded rejections for requests > 100 per minute from the same IP.
- **Configuration Validation:** Validates that starting the app without `DATABASE_URL` fails fast with a non-zero exit code.
- **Concurrency Protection:** Validates that parallel reads on a single-use capsule atomically decrement read counters, allowing exactly one success and returning one exhaustion response.

### Frontend UI & Validation Tests (Vitest + JSDOM)
- **Routing & Navigation:** Confirms navigation between home page and creation view.
- **Form Structure & Accessibility:** Asserts the presence of textareas, expiration options, labels, and accessible helper tags.
- **Local Validation:** Verifies empty or whitespace-only inputs are caught before hitting the network boundary.
- **Mocked Fetch Integration:** Captures submitted requests and asserts endpoint paths, POST methods, and payloads.

---

## 2. What's Blocked & Why

| Test Target | Status | Reason for Block |
| :--- | :--- | :--- |
| **Web Crypto API (Encryption/Decryption)** | **BLOCKED** | Browser-side cryptography is not implemented in the current frontend code (Form currently submits a static placeholder value `'TEMPORARY_ENCRYPTED_VALUE'`). |
| **Wrong Password/Key Decryption Failures** | **BLOCKED** | Client-side password-based key derivation is not implemented. |
| **Decryption/Reveal Flow UI** | **BLOCKED** | Frontend lacks a component or view for pasting links, inputting passwords, and fetching/decrypting capsule ciphertexts. |
| **Ciphertext Tampering Checks** | **BLOCKED** | Client-side crypto validation is not implemented. |
| **Playwright E2E Vertical Slice** | **BLOCKED** | Fully functional vertical flow (Browser encryption -> Store -> Retrieve -> Browser decryption) cannot be executed because both crypto and retrieval features are absent on the client side. |

---

## 3. Expected Future Tests

Once the client-side cryptographic functions and retrieval views are implemented, the testing suite should be extended with:

1. **Crypto Verification:**
   - Verify encryption produces unique IV/ciphertexts for the same plaintext (randomness check).
   - Assert key materials and plaintext passwords are never included in API requests.
   - Assert that modifying a single character of the ciphertext triggers GCM tag mismatch errors during Web Crypto decryption.

2. **API Isolation:**
   - Assert that the backend database receives only encrypted data, non-secret metadata, and timestamps.

3. **E2E Integration Flow:**
   - Playwright E2E verification of the full vertical slice: Input -> Encrypt -> API Store -> API Fetch -> Decrypt -> Render.
   - Verify proper distinct states for expired vs exhausted capsules in UI.
