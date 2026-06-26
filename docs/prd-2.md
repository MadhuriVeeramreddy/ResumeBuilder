# ResumeForge Product Requirements Document (PRD)

**Author:** Madhuri (PM hat)
**Date:** 2026-06-21
**Status:** Draft v1 — POC
**Source:** `docs/brief.md`

---

## 1. Goals and Background Context

### Goals
- Generate a polished, ATS-style, template-faithful `.docx` resume from minimal input (name, role, years, four companies).
- Produce domain-correct, low-repetition experience content across four roles automatically.
- Keep operator effort under ~2 minutes per resume and end-to-end generation under ~90 seconds.
- Ship a working POC: no auth, no payments, single operator, generate-and-download.

### Background Context
The operator places candidates and repeatedly hand-builds consultant/bench-style resumes — ~80 bullets, a domain-matched skills block, version-pinned environments, and a derived timeline. This is mechanical but nuanced. ResumeForge automates it with a structured multi-call generation pipeline grounded by a curated domain knowledge base, with deterministic timeline logic and faithful `.docx` assembly. See `docs/brief.md` for full context.

### Change Log
| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-06-21 | v1 | Initial POC PRD | Madhuri (PM) |

---

## 2. Requirements

### Functional Requirements

- **FR1:** The system shall present an input form capturing: candidate name, target role/title, total years of experience, and a list of four companies (company name + country/region; India role expected last). Optional contact placeholders (city, email, phone, LinkedIn).
- **FR2:** The system shall infer an industry domain for each company (e.g., healthcare payer, P&C insurance, automotive, capital markets, telecom, medical device, public-sector benefits, banking) using the company name and target role.
- **FR3:** The system shall select domain- and role-appropriate skill categories and tool vocabulary from a curated domain knowledge base (`domain-knowledge-base.json`).
- **FR4:** The system shall generate a Summary section: one dense keyword-rich opening sentence plus 12–18 gerund-style bullets.
- **FR5:** The system shall generate a categorized Skills section (9–11 labeled groups) appropriate to the candidate's role and domains.
- **FR6:** The system shall generate, per company, a role block containing: company · location · title · specialization · date range, a project name + intro paragraph, ~18–22 varied experience bullets each naturally embedding 3–5 tools, and a version-pinned "Environments" line.
- **FR7:** The system shall compute the employment timeline in code: split total years across the four companies in reverse-chronological order, the India company oldest, the most recent role ending in "Present", with contiguous, non-overlapping month/year ranges.
- **FR8:** The system shall enforce content diversity: minimize repeated opening verbs and over-reuse of the same tools across roles.
- **FR9:** The system shall validate every model response against a defined JSON schema and retry (with backoff / model fallback) on invalid or empty output.
- **FR10:** The system shall assemble the validated content into a `.docx` matching the house template (header, section headings, bold-run patterns, bullet style, Environments line) using the `docx` library.
- **FR11:** The system shall offer the assembled resume as a downloadable `.docx` file named after the candidate.
- **FR12:** The system shall call the LLM via OpenRouter using a configurable primary model and an ordered fallback list.
- **FR13:** The system shall surface generation progress (per-stage status) and clear error states to the operator.
- **FR14:** The system shall provide **5–8 selectable visual themes** (POC ships 8). A theme changes only presentation (fonts, colors, name treatment, heading style, rules, bullet glyph, spacing); content is identical across themes. All themes are single-column and ATS-safe. See `docs/theme-system.md`.
- **FR15:** Because content and presentation are separated, the operator shall be able to switch themes after generation and re-download without triggering another LLM generation (the cached `ResumeModel` is re-rendered).

### Non-Functional Requirements

- **NFR1:** End-to-end generation completes in under ~90 seconds under normal free-tier latency.
- **NFR2:** The OpenRouter API key is server-side only and never exposed to the client.
- **NFR3:** The system tolerates free-model rate limits (20 req/min, ~200/day) via the fallback chain and clear retry messaging.
- **NFR4:** The domain knowledge base is a versioned repo file, human-editable without code changes.
- **NFR5:** The model slug(s) are configuration-driven (env), not hardcoded.
- **NFR6:** Generated `.docx` opens cleanly in Microsoft Word and Google Docs without layout breakage.
- **NFR7:** The pipeline is deterministic where it must be: all date/timeline computation is pure code with unit tests.
- **NFR8:** The app runs as a single-operator internal tool; no public exposure assumptions, minimal hardening acceptable, but no secrets in the client bundle.
- **NFR9:** Every theme must remain ATS-parseable: single column, Office-standard fonts (no embedding), no text boxes/images/layout tables, color only on name/headings/rules, and real heading/bullet structures.

---

## 3. User Interface Design Goals

### Overall UX Vision
A single-screen, low-friction operator console: fill a short form, click Generate, watch staged progress, download. No dashboards, no navigation depth. Speed and clarity over polish.

### Key Interaction Paradigms
- One primary form, one primary action (Generate).
- Live per-stage progress (Planning → Role 1–4 → Assembling → Ready).
- Inline, actionable error states with a one-click retry.

### Core Screens and Views
- **Generator screen** (form + theme picker + progress + download).
- **Theme picker** inline on the same screen: 8 selectable theme cards (swatch + name), default `classic_navy`; switching after generation re-renders instantly without re-generating.

### Accessibility
None mandated for POC (internal single user). Keep contrast/legibility reasonable.

### Branding
Minimal, clean, neutral. Can echo a simple personal/eze.clinix-adjacent look but not required for POC.

### Target Device and Platforms
Web, desktop-first (operator workstation). Responsive not required for POC.

---

## 4. Technical Assumptions

### Repository Structure
Single Next.js app (monorepo not required). App Router.

### Service Architecture
Monolithic Next.js app with server-side API routes (route handlers) hosting the generation pipeline. No separate backend service for POC.

### Testing Requirements
- Unit tests for deterministic logic (timeline computation, schema validation, prompt assembly).
- Manual/visual verification of `.docx` fidelity against the four reference resumes.
- A model bake-off harness (script) to compare candidate free models on the same input.

### Additional Assumptions
- **Frontend/Backend:** Next.js (App Router) + TypeScript, server route handlers for generation.
- **LLM gateway:** OpenRouter (OpenAI-compatible). Primary `qwen/qwen3-coder:free`; fallback `deepseek/deepseek-v4-flash:free`, `meta-llama/llama-3.3-70b:free`.
- **Doc assembly:** `docx` npm library, server-side.
- **Persistence:** none required; domain KB as repo JSON. Supabase optional/post-POC.
- **Deployment:** Vercel (or local). Key stored as server env var.
- **Determinism:** date math in code.

---

## 5. Epic List

1. **Epic 1 — Foundation & Walking Skeleton:** Scaffold the app, wire OpenRouter, and produce a downloadable `.docx` from a single hardcoded role end-to-end (thin vertical slice).
2. **Epic 2 — Domain-Grounded Generation Engine:** The full multi-call pipeline — domain inference, knowledge base, per-role generation, deterministic timeline, schema validation/retry, repetition controls.
3. **Epic 3 — Template Fidelity, Themes & Operator UX:** Faithful `.docx` rendering, an 8-theme system (`docs/theme-system.md`), the input form + theme picker + staged progress UI, and error handling.

---

## 6. Epic Details

### Epic 1 — Foundation & Walking Skeleton

**Goal:** Establish the project skeleton and prove the riskiest path end-to-end: form input → one OpenRouter call → schema-validated content → a real `.docx` the operator can download. Delivers a working (if minimal) tool.

#### Story 1.1 — Project scaffold & configuration
As the operator, I want a running Next.js + TypeScript app with environment-based config, so that I have a foundation to build the generator on.
**Acceptance Criteria**
1. Next.js (App Router) + TypeScript project runs locally with a single page.
2. `OPENROUTER_API_KEY` and `RESUME_MODEL` (+ fallback list) are read from server env; none are exposed to the client bundle.
3. A health/check route confirms server env is loaded.
4. Linting/formatting configured; repo has a README with setup steps.

#### Story 1.2 — OpenRouter client with fallback
As a developer, I want a server-side OpenRouter client, so that the app can call a free model reliably.
**Acceptance Criteria**
1. A server module posts chat completions to `https://openrouter.ai/api/v1/chat/completions` with the configured primary model and `models` fallback list.
2. `response_format: { type: "json_object" }` is requested.
3. On 429/5xx/empty, the client retries with the next fallback model; failures are logged with the model used.
4. The key is only read server-side.

#### Story 1.3 — JSON schema + validate-and-retry helper
As a developer, I want a reusable "generate structured JSON" helper, so that model output is always schema-valid before use.
**Acceptance Criteria**
1. A helper accepts a prompt + a schema (e.g., Zod), calls the OpenRouter client, parses JSON, and validates.
2. On parse/validation failure it retries up to N times (configurable), optionally escalating model.
3. After exhausting retries it throws a typed error the UI can surface.
4. Unit tests cover success, invalid-JSON-then-success, and exhausted-retries paths.

#### Story 1.4 — Minimal `.docx` from a single role (thin slice)
As the operator, I want to submit a name + one company and download a basic `.docx`, so that the full path is proven.
**Acceptance Criteria**
1. A minimal form submits name + one company + role to a generation route.
2. The route generates one role block (intro + a few bullets) via the structured helper for a single hardcoded domain.
3. The `docx` library assembles a basic document (header + one role) server-side.
4. The browser downloads a valid `.docx` named after the candidate that opens cleanly in Word/Docs.

---

### Epic 2 — Domain-Grounded Generation Engine

**Goal:** Replace the thin slice with the real pipeline: infer domains, ground content in the knowledge base, generate all sections and four roles with diversity controls, and compute the timeline deterministically.

#### Story 2.1 — Seed the domain knowledge base
As the operator, I want a curated `domain-knowledge-base.json`, so that generated tools and versions are domain-correct.
**Acceptance Criteria**
1. `docs/domain-knowledge-base.json` exists with entries for the domains in the four reference resumes (healthcare payer, P&C insurance, public-sector benefits, banking, automotive, capital markets, medical device, telecom).
2. Each domain provides: display label, tool list, version-pinned environment items, sample project-name patterns, and domain skill categories.
3. Role base stacks exist for Business Analyst, Data Analyst, and C++ Developer.
4. The file is loaded at runtime and human-editable without code changes.

#### Story 2.2 — Domain inference / plan call
As a developer, I want a plan call that maps each company to a domain and a generation plan, so that downstream calls are grounded.
**Acceptance Criteria**
1. Given role + four companies, a plan call returns: per-company domain, chosen skill categories, and which KB tool sets apply.
2. Output is schema-validated; unknown companies fall back to a sensible default domain for the role.
3. The plan references KB keys (not free-text) so role calls can look up grounded tools.

#### Story 2.3 — Deterministic timeline computation
As the operator, I want correct, non-overlapping dates, so that the resume is internally consistent.
**Acceptance Criteria**
1. Pure function splits total years across four companies, reverse-chronological, India oldest, most recent ends "Present".
2. Ranges are contiguous and non-overlapping, in `Mon YYYY` format.
3. Distribution is sensible (e.g., recent roles longer) and configurable.
4. Unit tests cover 9, 10, and 10+ year inputs and edge counts (3 and 5 companies).

#### Story 2.4 — Summary & Skills generation
As the operator, I want grounded Summary and Skills sections, so that the top of the resume is strong and domain-correct.
**Acceptance Criteria**
1. Summary = one dense opening sentence + 12–18 gerund bullets, drawing tools from the plan's domains.
2. Skills = 9–11 labeled categories appropriate to role + domains, populated from the KB.
3. Both are schema-validated.

#### Story 2.5 — Per-role experience generation with diversity controls
As the operator, I want each role generated with varied bullets and domain-correct environments, so that the experience reads professional and non-repetitive.
**Acceptance Criteria**
1. For each company, a role call returns project name, intro paragraph, 18–22 bullets, and an Environments line — grounded by that domain's KB entry.
2. The call receives already-used opening verbs/tools and is instructed to diversify.
3. Environments items use version-pinned values from the KB.
4. Output is schema-validated; on failure the validate-and-retry helper handles it.

#### Story 2.6 — Orchestration & assembly into the resume model
As a developer, I want an orchestrator that runs plan → timeline → summary/skills → 4 roles and assembles one resume object, so that the document layer has a clean input.
**Acceptance Criteria**
1. The orchestrator runs the stages, attaching computed dates to each role.
2. Stages run with controlled concurrency that respects free-tier rate limits.
3. The result is a single validated `ResumeModel` object.
4. Partial failures produce a typed error identifying the failed stage.

---

### Epic 3 — Template Fidelity & Operator UX

**Goal:** Make output indistinguishable from the house style and give the operator a fast, clear console.

#### Story 3.1 — Faithful `.docx` template
As the operator, I want the `.docx` to match the reference resumes, so that output needs no reformatting.
**Acceptance Criteria**
1. A `docx`-library renderer reproduces: name header + contact line, section headings, Summary (sentence + bullets), categorized Skills (bold label + items), per-role header line (company/location/title/specialization/dates with correct bold/italic), bullets, and Environments line.
2. Visual comparison against at least two reference resumes (e.g., Mamatha + Sharan) shows matching structure and styling.
3. Document opens cleanly in Word and Google Docs.

#### Story 3.2 — Operator generator screen
As the operator, I want a single-screen form with staged progress, so that generating is fast and legible.
**Acceptance Criteria**
1. The form captures FR1 inputs with light validation (4 companies, years numeric).
2. Submitting shows staged progress (Planning → Role 1–4 → Assembling → Ready).
3. On success, a Download button delivers the `.docx`.
4. The screen is usable on a desktop browser.

#### Story 3.3 — Error handling & retry
As the operator, I want clear errors and one-click retry, so that free-tier hiccups don't block me.
**Acceptance Criteria**
1. Rate-limit/model failures show a readable message naming the stage.
2. A Retry action re-runs only the failed stage where feasible, else the whole job.
3. No raw stack traces or keys appear in the UI.

#### Story 3.4 — Reference validation pass
As the operator, I want to regenerate all four reference profiles, so that I can confirm ship-quality.
**Acceptance Criteria**
1. Generating Mamatha, Bhargavi, Vasu, and Sharan from minimal input produces template-faithful, domain-correct `.docx` files.
2. Bullet repetition and tool correctness are judged acceptable (light edits only).
3. Findings feed back into the KB / prompts.

#### Story 3.5 — Theme system & registry (8 themes)
As the operator, I want 8 distinct, ATS-safe themes, so that I can match different house styles.
**Acceptance Criteria**
1. `ResumeTheme` type + `lib/themes/registry.ts` with all 8 theme token files per `docs/theme-system.md`.
2. The single renderer reads styling only from the active theme; unknown `themeId` falls back to the default.
3. Each of the 8 themes renders the same `ResumeModel` to a valid `.docx` that opens cleanly in Word and Google Docs.
4. Every theme is single-column and ATS-safe (NFR9).

#### Story 3.6 — Theme picker UI & instant re-render
As the operator, I want to pick a theme and switch it after generating, so that browsing looks is fast and free.
**Acceptance Criteria**
1. The generator screen shows 8 theme cards (swatch + name); default `classic_navy`; selection sets `themeId`.
2. After a resume is generated, changing the theme re-renders the cached `ResumeModel` and offers a new download **without** another LLM call.
3. Each theme produces a correctly named, valid `.docx`.

---

## 7. Next Steps

- **UX Expert:** produce `docs/front-end-spec.md` from Section 3.
- **Architect:** produce `docs/architecture.md` from Sections 2 & 4.
- **Scrum Master:** shard epics into `docs/epics/` and draft stories for development.
