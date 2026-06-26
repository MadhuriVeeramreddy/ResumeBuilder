# Epic 2 — Domain-Grounded Generation Engine

**Source:** `docs/prd.md` §6 · **Architecture:** `docs/architecture.md` §5–6
**Goal:** Replace the thin slice with the real pipeline — infer domains, ground content in the knowledge base, generate all sections and four roles with diversity controls, and compute the timeline deterministically.

**Sequencing:** 2.1 → 2.2 → 2.3 → 2.4 → 2.5 → 2.6.

---

## Story 2.1 — Seed the domain knowledge base
**As** the operator, **I want** a curated `domain-knowledge-base.json`, **so that** generated tools and versions are domain-correct.

**Acceptance Criteria**
1. KB exists covering the reference domains (healthcare payer, P&C insurance, public-sector benefits, banking, automotive embedded, automotive analytics, capital markets, medical device, telecom).
2. Each domain has: label, tools, version-pinned environments, projectPatterns, companyHints, skillCategory.
3. Role base stacks exist for Business Analyst, Data Analyst, C++ Developer.
4. `lib/kb.ts` loads it at runtime; editing the file requires no code changes.

**Dev Notes:** A seed ships in `docs/domain-knowledge-base.json`; validate it loads and type-checks against a KB schema.

---

## Story 2.2 — Domain inference / plan call
**As** a developer, **I want** a plan call mapping each company to a domain + plan, **so that** downstream calls are grounded.

**Acceptance Criteria**
1. Given role + companies, the plan call returns per-company `{domain, location, title, specialization}` + 9–11 skill categories.
2. Output validated against `GenerationPlanSchema`.
3. Domain selection cross-checked against `companyHints`; unknown companies fall back to a sensible role default.
4. Plan references KB keys (not free text) so role calls can look up grounded tools.

---

## Story 2.3 — Deterministic timeline computation
**As** the operator, **I want** correct, non-overlapping dates, **so that** the resume is internally consistent.

**Acceptance Criteria**
1. `lib/timeline.ts` pure function splits total years across roles, reverse-chronological, India oldest, most recent ends "Present".
2. Ranges contiguous, non-overlapping, `Mon YYYY` formatted.
3. Distribution sensible (recent roles longer) and weight-configurable.
4. Vitest covers 9, 10, 10+ years and 3- and 5-company edge cases.

---

## Story 2.4 — Summary & Skills generation
**As** the operator, **I want** grounded Summary and Skills sections, **so that** the top of the resume is strong and domain-correct.

**Acceptance Criteria**
1. Summary = one dense opening sentence + 12–18 gerund bullets using the plan's domain tools.
2. Skills = 9–11 labeled categories from KB role categories + domain skillCategories.
3. Both schema-validated.

---

## Story 2.5 — Per-role experience generation with diversity controls
**As** the operator, **I want** each role generated with varied bullets and correct environments, **so that** experience reads professional and non-repetitive.

**Acceptance Criteria**
1. Each role call returns projectName, intro, 18–22 bullets, environments — grounded by that domain's KB entry.
2. The call receives already-used opening verbs/tools and is told to diversify.
3. Environments use version-pinned KB values.
4. Validated via `RoleContentSchema`; failures handled by `structuredGenerate`.

**Dev Notes:** Accumulate `usedVerbs`/`usedTools` across the four role calls and feed them forward.

---

## Story 2.6 — Orchestration & assembly into ResumeModel
**As** a developer, **I want** an orchestrator running plan → timeline → summary/skills → 4 roles → ResumeModel, **so that** the document layer gets clean input.

**Acceptance Criteria**
1. Orchestrator runs stages and attaches computed dates to each role.
2. Role calls run with bounded concurrency respecting free-tier limits (`GEN_CONCURRENCY`).
3. Result is a single validated `ResumeModel`.
4. Partial failures throw a typed `StageError` naming the failed stage.

**Definition of Done (Epic 2):** From minimal input, the engine produces a complete, validated, domain-correct `ResumeModel` with a correct timeline.
