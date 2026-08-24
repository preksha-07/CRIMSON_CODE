# RAVEN Test Plan 

---

## 0. Pre-flight (do this before writing any test)

- [ ] Confirm `package.json`'s `test` script actually runs `vitest run` (single-shot), not
      watch-mode `vitest` — check for duplicate keys before wiring this into CI. A watch-mode
      test command will hang CI forever instead of failing cleanly.
- [ ] Confirm the test DB is a real, disposable Postgres instance (Docker Compose per the
      architecture plan) — never point tests at a shared dev database, since several tests
      below intentionally create expired/exhausted rows.

---

## 1. Backend / API Tests

### Health Check
- [ ] `GET /api/health` returns `200` with `{ status: "ok" }`.

### Capsule Creation — `POST /api/capsules`
- [ ] Valid payload (`ciphertext`, `expiresAt` in the future, optional `metadata`,
      optional `maxReads`) returns `201` with `{ id, expiresAt }`.
- [ ] Returned `id` is a 24-char hex string (matches `randomBytes(12).toString("hex")`) —
      asserting the shape now makes it obvious later if ID generation ever changes.
- [ ] Missing `ciphertext` → `400` with Zod's flattened error shape.
- [ ] Empty-string `ciphertext` → `400` (schema requires `.min(1)`).
- [ ] `ciphertext` over 1,500,000 chars → `400` (schema-level rejection, distinct from #next).
- [ ] Request body over Fastify's global 2MB `bodyLimit` → `413`, not `400` — **this is a
      different code path than the schema check above; test both separately.**
- [ ] `expiresAt` in the past → `400` (schema's `.refine` on future timestamp).
- [ ] `expiresAt` not valid ISO 8601 → `400`.
- [ ] `maxReads` of `0`, negative, non-integer, or `> 100` → `400`.
- [ ] Malformed JSON body (e.g. truncated `{`) → `400`, handled by Fastify before your
      route/schema code ever runs — confirm this doesn't 500.
- [ ] Unexpected extra top-level fields (e.g. `{ ciphertext, isAdmin: true }`) are silently
      dropped, not stored or reflected — Zod's default behavior, but assert it explicitly.
- [ ] Arbitrarily large/deeply-nested `metadata` object — **expected to currently succeed,
      since `z.record(z.unknown())` has no size or depth bound.** Write this test to document
      the gap and flag it to CIPHER as a should-fix, not to assert current (wrong) behavior
      as correct.

### Capsule Retrieval — `GET /api/capsules/:id`
- [ ] Existing, unexpired, unexhausted capsule → `200` with `{ id, ciphertext, metadata,
      expiresAt, remainingReads }`.
- [ ] ID that was never created → `404` `{ error: "Capsule not found" }`.
- [ ] ID that is a near-miss of a real one (off-by-one hex char) → `404`, not `200` or `500`
      — basic enumeration-resistance check.
- [ ] Existing but expired capsule → `410` `{ error: "Capsule expired" }` — **must be `410`,
      not `404`; the route explicitly differentiates these.**
- [ ] Existing but `remaining_reads` already at 0 → `410` `{ error: "Max read limit
      reached" }`.
- [ ] Capsule created with `maxReads: null` (unlimited) is retrievable repeatedly without
      `remainingReads` ever decrementing below null.

### Password Protection — **not a backend concern, do not test here**
- [ ] N/A on the server. Password strengthens the client-side derived key only; the server
      never receives it and cannot validate it. Move "wrong password → can't decrypt" to
      VIXEN's frontend crypto unit tests (assert `crypto.subtle.decrypt` rejects on a
      wrong-password-derived key due to GCM tag mismatch).
- [ ] The only backend-relevant assertion: creating and retrieving a capsule behaves
      identically whether or not the client happened to use a password-strengthened key —
      the server-side ciphertext is opaque either way.

### Read Limits (atomic decrement)
- [ ] `maxReads: 1` capsule: first `GET` succeeds and returns `remainingReads: 0`; the
      *same* response also confirms the decrement happened in the same request, not a
      separate step.
- [ ] Second `GET` on that same capsule → `410`.
- [ ] `maxReads: 3`: three successful reads, third response shows `remainingReads: 0`,
      fourth read → `410`.

### Expiry
- [ ] Capsule with `expiresAt` a few seconds in the future is retrievable now.
- [ ] Capsule manually inserted (via direct SQL in test setup, not the API — the API
      itself refuses past `expiresAt`) with `expires_at` in the past → `410` on retrieval.

### CORS
- [ ] Request with `Origin: http://localhost:5173` succeeds with the expected
      `Access-Control-Allow-Origin` header.
- [ ] Request with an arbitrary `Origin` (e.g. `http://evil.example`) does not get that
      origin reflected back in `Access-Control-Allow-Origin`.

### Rate Limiting
- [ ] Sending >100 requests within one minute from the same client gets a `429` at some
      point — doesn't need to be exhaustive, just confirm the limiter is actually wired in,
      not just configured.

### Config / Startup
- [ ] Starting the app with `DATABASE_URL` unset causes `env.ts`'s Zod parse to throw and
      the process to fail fast, rather than starting and failing confusingly on first query.

### Security / Input Validation
- [ ] XSS-style payload in `ciphertext` or `metadata` (e.g. `<script>alert(1)</script>`) is
      stored and returned byte-for-byte as JSON — the point is confirming the **server**
      never interprets or unescapes it (that's the CVE-2026-55891 lesson: never treat
      request-derived strings as safe to reinterpret). Actual XSS *prevention* is a frontend
      rendering concern (never use `innerHTML` on paste content) — note that split clearly
      so the two teams don't each assume the other covers it.
- [ ] Oversized/malformed requests don't produce a `500` or stack trace in the response body
      — errors should always be the structured `{ error: ... }` shape, never leak internals.

---

## 2. Frontend / E2E Tests
*(unchanged from the original plan — these are fine as written and don't depend on backend
internals)*

### Main User Flow
- [ ] User opens the home page.
- [ ] User creates a capsule.
- [ ] Capsule creation produces a shareable link.
- [ ] Recipient opens the link.
- [ ] Recipient can unlock/reveal the capsule.
- [ ] Original secret is displayed correctly.

### Capsule Lifecycle
- [ ] Expired capsule displays the correct state (should distinguish "expired" from
      "read-limit reached" in the UI, matching the backend's 410-with-distinct-message).
- [ ] Used-up capsule displays the correct state.
- [ ] Invalid capsule link displays the correct error (matching backend 404).

### Password Flow
- [ ] Password-protected capsule asks for password.
- [ ] Correct password reveals the capsule.
- [ ] Incorrect password fails client-side decryption and shows a clear error — this is
      where the "wrong password" test actually belongs, not in the backend suite.

---

## 3. Concurrency Test — needs real parallelism, not sequential awaits

For a capsule with `maxReads: 1`:

- [ ] Fire two `GET /api/capsules/:id` requests **genuinely in parallel** — `Promise.all([
      fetch(url), fetch(url) ])` is the minimum bar; for a stronger guarantee, use a load
      tool (`autocannon`, `k6`) that opens two real concurrent connections, since a single
      Node process awaiting sequentially will not actually race the database.
- [ ] Expected: exactly one request gets `200`, the other gets `410`. Never both `200`,
      never both `410`.
- [ ] This is testing the atomic `UPDATE ... WHERE remaining_reads > 0 ... RETURNING`
      query specifically — if you want a lower-level guarantee than an HTTP race, you can
      also fire two concurrent raw queries directly against the DB pool in a unit test,
      bypassing HTTP entirely, to isolate whether a failure is in the SQL or in the HTTP
      layer.

**[BLOCKED]** Delete-token / revocation replay test — no `DELETE` route or delete-token
issuance exists in the current code (`delete_token_hash` column is present but unused).
Add this test once CIPHER ships that endpoint; don't write it against a feature that
doesn't exist yet.

---

## 4. CI Pipeline

GitHub Actions, on every PR:

1. Install dependencies.
2. **Verify `test` script is `vitest run`, not watch-mode `vitest`** (see Pre-flight) —
   a hanging CI job is worse than a failing one, since it silently blocks merges without
   a clear error.
3. Run backend tests (needs a real Postgres service container, not mocks, for the
   concurrency and expiry tests to mean anything).
4. Run frontend unit tests.
5. Run E2E tests (Playwright) against a built app.
6. Build the application (`tsc` typecheck should also run here, separately from tests).
7. Report pass/fail as a required status check — branch protection should block merge on
   any red job, per Part E.0's "nobody merges their own PR without review + green CI" rule.
