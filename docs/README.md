# ResumeForge — BMAD Documentation Suite

Internal, single-operator AI resume generator. Minimal input (name, role, years, four companies) → polished, ATS-style, template-faithful `.docx`. POC scope: no auth, no payments, generate-and-download.

## Documents
| File | Owner (BMAD) | Purpose |
|------|--------------|---------|
| [`brief.md`](./brief.md) | Analyst | Problem, goals, users, scope, risks |
| [`prd.md`](./prd.md) | PM | FRs/NFRs, UI goals, technical assumptions, epics & stories |
| [`front-end-spec.md`](./front-end-spec.md) | UX Expert | Screens, flows, components, wireframes |
| [`architecture.md`](./architecture.md) | Architect | Stack, data models, pipeline, schemas, `.docx` assembly, source tree |
| [`theme-system.md`](./theme-system.md) | Architect + UX | 8 ATS-safe resume themes, token schema, renderer rules, theme picker |
| [`domain-knowledge-base.json`](./domain-knowledge-base.json) | — | Curated domain→tools/versions grounding (the quality asset) |
| [`epics/`](./epics/) | Scrum Master | Sharded epics + dev-ready stories |

## Epics
1. [Foundation & Walking Skeleton](./epics/epic-1-foundation-walking-skeleton.md) — scaffold, OpenRouter, schema+retry, thin-slice `.docx`.
2. [Domain-Grounded Generation Engine](./epics/epic-2-generation-engine.md) — KB, plan call, timeline, summary/skills, per-role generation, orchestration.
3. [Template Fidelity & Operator UX](./epics/epic-3-template-fidelity.md) — faithful template(s), generator screen, error handling, reference validation.

## Build order
Epic 1 → Epic 2 → Epic 3, story by story. Start each story by drafting it with the SM agent from the relevant epic file, implement, then validate against acceptance criteria.

## Key technical decisions (locked)
- **Stack:** Next.js (App Router) + TypeScript, server route handlers, Vercel/local.
- **LLM:** OpenRouter, primary `qwen/qwen3-coder:free`, fallback `deepseek/deepseek-v4-flash:free`, `meta-llama/llama-3.3-70b:free`.
- **Grounding:** curated `domain-knowledge-base.json` (the model weaves provided tools, not recalled ones).
- **Determinism:** all date/timeline math in pure, tested code — never the model.
- **Reliability:** Zod schema + validate-and-retry on every model call.
- **Output:** `docx` npm library, server-side, faithful to the four reference resumes.
- **Themes:** 8 selectable, ATS-safe visual themes driven by token objects through one renderer; content and presentation are separate, so switching theme after generation re-renders instantly with no extra LLM call (`docs/theme-system.md`).

## Positioning note
Generated experience is domain-plausible scaffolding to be reviewed and grounded against real candidate history before use — a drafting/formatting accelerator, not a source of verified facts.
