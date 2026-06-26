# Epic 1 — Foundation & Walking Skeleton

**Source:** `docs/prd.md` §6 · **Architecture:** `docs/architecture.md`
**Goal:** Stand up the app and prove the riskiest path end-to-end — form input → one OpenRouter call → schema-validated content → a downloadable `.docx`. Delivers a minimal but working tool and de-risks every layer.

**Sequencing:** 1.1 → 1.2 → 1.3 → 1.4 (each depends on the prior).

---

## Story 1.1 — Project scaffold & configuration
**As** the operator, **I want** a running Next.js + TypeScript app with env-based config, **so that** I have a foundation to build on.

**Acceptance Criteria**
1. Next.js (App Router) + TypeScript runs locally with a single page at `/`.
2. `OPENROUTER_API_KEY`, `RESUME_MODEL`, `RESUME_FALLBACKS` read from server env; none in the client bundle.
3. `/api/health` route returns ok and confirms server env is present (without echoing secrets).
4. ESLint + Prettier + Tailwind configured; README documents setup and env vars.

**Dev Notes:** Set `export const runtime = 'nodejs'` on server routes. Add `.env.local` to `.gitignore`.

---

## Story 1.2 — OpenRouter client with fallback
**As** a developer, **I want** a server-side OpenRouter client, **so that** the app can call a free model reliably.

**Acceptance Criteria**
1. `lib/openrouter.ts` POSTs to `https://openrouter.ai/api/v1/chat/completions` with primary `RESUME_MODEL` and a `models` fallback list from `RESUME_FALLBACKS`.
2. Requests set `response_format: { type: "json_object" }`.
3. On 429/5xx/empty, rotate to the next fallback model; log attempt + model used.
4. Key read server-side only; never imported by a client component.

**Dev Notes:** Use native `fetch`. Add `Authorization: Bearer` + content-type headers. Keep a small typed wrapper returning the raw assistant string.

---

## Story 1.3 — Structured generate helper (schema + retry)
**As** a developer, **I want** a reusable structured-JSON helper, **so that** model output is always schema-valid before use.

**Acceptance Criteria**
1. `lib/structured.ts` exports `structuredGenerate(prompt, zodSchema, opts)`: call client → strip code fences → `JSON.parse` → `schema.parse`.
2. Retries up to `GEN_MAX_ATTEMPTS`, rotating/escalating model per attempt.
3. On exhausted retries, throws a typed `StageError(stageName)`.
4. Vitest covers: first-try success, invalid-JSON-then-success, exhausted-retries.

---

## Story 1.4 — Minimal `.docx` from a single role (thin slice)
**As** the operator, **I want** to submit a name + one company and download a basic `.docx`, **so that** the full path is proven.

**Acceptance Criteria**
1. Minimal form posts name + one company + role to `/api/generate`.
2. The route generates one role block (intro + a few bullets) via `structuredGenerate` for one hardcoded domain.
3. `lib/docx/assemble.ts` builds a basic `Document` (header + one role) and returns a `Buffer` via `Packer.toBuffer`.
4. Browser downloads a valid `.docx` named `<name>.docx` that opens cleanly in Word and Google Docs.

**Definition of Done (Epic 1):** A real, if minimal, resume `.docx` downloads end-to-end from operator input.
