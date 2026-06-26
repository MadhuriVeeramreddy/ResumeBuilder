# ResumeForge Fullstack Architecture Document

**Author:** Madhuri (Architect hat)
**Date:** 2026-06-21
**Status:** Draft v1 — POC
**Source:** `docs/prd.md`, `docs/front-end-spec.md`

---

## 1. Introduction

This document defines the architecture for ResumeForge, an internal single-operator resume generator. It is a monolithic Next.js application whose core is a structured multi-call LLM pipeline (via OpenRouter) plus deterministic timeline logic and server-side `.docx` assembly. No auth, no payments, no external persistence required for the POC.

**Starter:** Greenfield Next.js (App Router) + TypeScript. No external starter template.

### Change Log
| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-06-21 | v1 | Initial POC architecture | Madhuri (Architect) |

---

## 2. High-Level Architecture

### Technical Summary
A single Next.js app serves a one-screen operator UI and hosts server route handlers that run the generation pipeline. The pipeline calls OpenRouter (OpenAI-compatible) using a free model with a fallback chain, grounding every call in a curated domain knowledge base. All LLM output is schema-validated with retry. The employment timeline is computed in pure code. Validated content is assembled into a `.docx` with the `docx` library and streamed to the browser for download. Deployed to Vercel (or run locally); the only secret is the OpenRouter key, held server-side.

### Architecture Diagram
```
┌─────────────────────────────────────────────────────────────┐
│                       Browser (Operator)                      │
│   Generator screen: form ─► progress ─► download .docx        │
└───────────────┬───────────────────────────▲──────────────────┘
                │ POST /api/generate          │ .docx (stream)
                ▼                             │
┌─────────────────────────────────────────────────────────────┐
│                 Next.js server (route handlers)               │
│                                                               │
│   /api/generate                                               │
│     └─ Orchestrator                                           │
│          1. Plan call ───────────────┐                        │
│          2. computeTimeline() (code) │                        │
│          3. Summary + Skills calls    ├─► structuredGenerate  │
│          4. Role calls ×4 ────────────┘     (schema+retry)    │
│          5. assembleDocx()  ──────────────► docx library      │
│                                                               │
│   reads: domain-knowledge-base.json (repo file)               │
└───────────────┬───────────────────────────────────────────────┘
                │ HTTPS (OpenAI-compatible)
                ▼
        ┌───────────────────────┐
        │      OpenRouter        │  primary: qwen/qwen3-coder:free
        │  (model + fallbacks)   │  fallback: deepseek-v4-flash, llama-3.3-70b
        └───────────────────────┘
```

### Architectural Patterns
- **Monolith with server route handlers** — simplest viable shape for one operator.
- **Pipeline / orchestrator** — discrete, individually retryable stages.
- **Schema-first LLM I/O** — every model call has a typed contract (Zod) + validate-and-retry.
- **Determinism boundary** — anything that must be correct (dates, counts) is pure code, never the model.
- **Config-driven models** — model slugs and fallbacks in env, swappable without code changes.
- **Knowledge-base grounding** — the model weaves *provided* tools rather than recalling them, moving accuracy from model to data.

---

## 3. Tech Stack

| Category | Technology | Version (indicative) | Purpose | Rationale |
|----------|-----------|----------------------|---------|-----------|
| Language | TypeScript | 5.x | App + pipeline | Type safety across LLM contracts |
| Framework | Next.js (App Router) | 15.x | UI + server routes | One deployable, route handlers for pipeline |
| Runtime | Node.js | 20.x LTS | Server | `docx` needs Node runtime (not edge) |
| LLM gateway | OpenRouter | — | Model access | One key, many models, OpenAI-compatible, free tier |
| Primary model | `qwen/qwen3-coder:free` | — | Generation | Strong instruction-following + structured output, 1M ctx |
| Fallback models | `deepseek/deepseek-v4-flash:free`, `meta-llama/llama-3.3-70b:free` | — | Resilience | Rate-limit / outage failover |
| Validation | Zod | 3.x | Schema + parse | Runtime validation of model JSON |
| Doc assembly | `docx` | latest | `.docx` generation | Programmatic, faithful, Node-side |
| HTTP | native `fetch` | — | OpenRouter calls | No SDK lock-in; OpenAI-compatible |
| Styling | Tailwind CSS | 3.x | UI | Fast, minimal |
| Testing | Vitest | latest | Unit tests | Timeline, schema, prompt assembly |
| Deploy | Vercel (or local) | — | Hosting | Zero-config Next.js; env secret |
| Persistence | none (POC) | — | — | KB is a repo file; Supabase optional post-POC |

> **Runtime note:** The `/api/generate` route must use the Node.js runtime (`export const runtime = 'nodejs'`), not Edge — the `docx` library and Buffer streaming require it. Generation can exceed default serverless timeouts; set `maxDuration` accordingly on Vercel or run locally for the POC.

---

## 4. Data Models

These are in-memory types (no database). Defined with Zod and inferred to TS.

### GenerationInput
```ts
type Company = { name: string; country: string }; // country e.g. "USA" | "India"
type GenerationInput = {
  name: string;
  role: string;            // e.g. "Business Analyst"
  yearsExperience: number; // e.g. 10
  companies: Company[];    // length 4 (tolerate 3–5); India last
  contact?: { city?: string; email?: string; phone?: string; linkedin?: string };
  templateId?: string;     // stretch
};
```

### GenerationPlan (output of plan call)
```ts
type RolePlan = {
  company: string;
  location: string;        // inferred US city/state or India city
  domainKey: string;       // KB key e.g. "healthcare_payer"
  title: string;           // e.g. "Senior Business Analyst"
  specialization: string;  // e.g. "Payer Modernization"
};
type GenerationPlan = {
  skillCategories: { label: string; items: string[] }[]; // 9–11
  roles: RolePlan[];       // aligned to input.companies order
};
```

### Timeline (computed in code)
```ts
type DateRange = { start: string; end: string }; // "Feb 2024" | "Present"
type Timeline = DateRange[]; // aligned to roles, reverse-chronological
```

### RoleContent (output per role call)
```ts
type RoleContent = {
  projectName: string;          // e.g. "Payer Modernization"
  intro: string;                // 1 dense paragraph
  bullets: string[];            // 18–22
  environments: string[];       // version-pinned items
};
```

### ResumeModel (assembled, fed to docx)
```ts
type ResumeModel = {
  name: string;
  title: string;
  contact: { city?: string; email?: string; phone?: string; linkedin?: string };
  summary: { opening: string; bullets: string[] }; // 12–18 bullets
  skills: { label: string; items: string[] }[];
  education?: string[];
  roles: Array<RolePlan & RoleContent & { dates: DateRange }>;
  themeId: string; // selected visual theme; see docs/theme-system.md
};
```

---

## 5. Domain Knowledge Base

`docs/domain-knowledge-base.json` is the grounding asset, loaded at runtime. Shape:

```jsonc
{
  "roles": {
    "Business Analyst": { "baseSkills": ["BRD","FRD","RTM","..."], "categories": ["..."] }
  },
  "domains": {
    "healthcare_payer": {
      "label": "Healthcare Payer",
      "tools": ["Facets","QNXT","HIPAA","HL7","FHIR","EDI X12 837/835","..."],
      "environments": ["Facets 6.x","QNXT 5.x","HIPAA 5010","FHIR R4","SQL Server 2019","..."],
      "projectPatterns": ["Payer Modernization","Care Intelligence","Claims ..."],
      "skillCategories": [
        { "label": "Healthcare Payer", "items": ["Facets","QNXT","HIPAA","..."] }
      ],
      "companyHints": ["cigna","unitedhealth","aetna","humana","anthem"]
    }
  }
}
```

`companyHints` assist domain inference; the model's plan call can be cross-checked against these for safety. The file is human-editable; expanding it improves quality without code changes.

---

## 6. Core Pipeline & Workflows

### structuredGenerate helper (schema + retry)
```
structuredGenerate(prompt, zodSchema, opts):
  for attempt in 1..maxAttempts:
    model = opts.models[min(attempt-1, last)]   // escalate/rotate on retry
    raw   = openRouter.chat(prompt, model, { response_format: json_object })
    try:   json = JSON.parse(strip_fences(raw)); return zodSchema.parse(json)
    catch: log(attempt, model, error); continue
  throw StageError(stageName)
```

### Orchestrator (/api/generate)
```
1. validate input (Zod)
2. plan      = structuredGenerate(planPrompt(input, KB), GenerationPlanSchema)
3. timeline  = computeTimeline(input.yearsExperience, plan.roles)   // pure code
4. summary   = structuredGenerate(summaryPrompt(input, plan, KB), SummarySchema)
5. roles[]   = for each rolePlan (bounded concurrency, rate-limit aware):
                 structuredGenerate(rolePrompt(rolePlan, KB, usedVerbs, usedTools), RoleContentSchema)
               // accumulate usedVerbs/usedTools across roles for diversity
6. resume    = assembleResumeModel(input, plan, timeline, summary, roles)
7. buffer    = assembleDocx(resume)            // docx library
8. stream buffer as attachment (filename: <name>.docx)
```

### computeTimeline (deterministic)
```
- totalMonths = yearsExperience * 12
- weights: recent roles get more (e.g. [0.32, 0.28, 0.22, 0.18]) — configurable
- allocate months per role by weight; round; fix rounding drift on the oldest role
- walk backward from "now": most recent role end = "Present"
- each earlier role ends the month before the next role starts (contiguous, no overlap)
- format "Mon YYYY"; India role is oldest by construction
- unit-tested for 9/10/10+ years and 3–5 companies
```

> **Diversity controls:** role prompts receive the set of opening verbs and tools already used and are instructed to avoid reuse. The KB caps which tools are even available per domain, preventing cross-domain bleed.

---

## 7. `.docx` Assembly (theme-driven)

A **single** theme-agnostic renderer maps `ResumeModel` → `docx` document, reading all styling (fonts, colors, name treatment, heading style, rules, bullet glyph, spacing, margins) from the active `ResumeTheme` selected by `resume.themeId`. Themes are token objects, not separate renderers — adding a theme is data. The POC ships **8 selectable themes**, all single-column and ATS-safe. Full token schema, the 8 themes, and the apply rules are in **`docs/theme-system.md`**.

Because content and presentation are separate, switching themes after generation re-renders the cached `ResumeModel` with no additional LLM call.

Structure reproduced (matching the reference resumes), styled per theme:
- **Header:** name (large, accent), contact line (city · email · phone · LinkedIn).
- **Summary:** dense opening paragraph, then gerund bullets.
- **Skills:** each category as a paragraph with a **bold label**: comma-separated items.
- **Education:** single line(s).
- **Experience:** per role —
  - line 1: **Company** · Location
  - line 2: **Title — Specialization** *| Mon YYYY – Mon YYYY/Present* (bold + italic runs)
  - project intro paragraph
  - bullets
  - **Environments:** version-pinned line
- Consistent heading style (uppercase section headers with a bottom rule, per the references).

Implementation notes: build with `Document`, `Paragraph`, `TextRun`, `HeadingLevel`/custom styles, `Numbering`/`Bullet` for lists; return a `Buffer` via `Packer.toBuffer`. All theme-varying values come from the `ResumeTheme` token object resolved via `lib/themes/registry.ts` (`getTheme(resume.themeId)`, falling back to the default). Note `docx` units: font size in half-points (pt×2), borders/spacing/margins in twips (1pt=20tw, 1in=1440tw).

---

## 8. Source Tree

```
resumeforge/
├─ app/
│  ├─ page.tsx                 # Generator screen (form + progress + download)
│  ├─ api/
│  │  ├─ generate/route.ts     # runtime=nodejs; orchestrator entrypoint
│  │  └─ health/route.ts
│  └─ globals.css
├─ lib/
│  ├─ openrouter.ts            # client + fallback chain
│  ├─ structured.ts           # structuredGenerate (schema+retry)
│  ├─ orchestrator.ts         # pipeline
│  ├─ timeline.ts             # computeTimeline (pure)
│  ├─ prompts/
│  │  ├─ plan.ts
│  │  ├─ summary.ts
│  │  └─ role.ts
│  ├─ schemas.ts              # Zod schemas + inferred types
│  ├─ kb.ts                   # load domain-knowledge-base.json
│  ├─ themes/                 # see docs/theme-system.md
│  │  ├─ types.ts             # ResumeTheme
│  │  ├─ registry.ts          # getTheme(id), DEFAULT_THEME_ID
│  │  └─ themes/              # 8 token files (classic-navy.ts, ...)
│  └─ docx/
│     └─ assemble.ts          # ResumeModel + theme -> Buffer (one renderer)
├─ components/                # TextField, ProgressList, ErrorCard, ...
├─ docs/                      # BMAD docs (this suite)
│  └─ domain-knowledge-base.json
├─ scripts/
│  └─ bakeoff.ts              # run same input across candidate models
├─ tests/
│  ├─ timeline.test.ts
│  └─ schemas.test.ts
├─ .env.local                 # OPENROUTER_API_KEY, RESUME_MODEL, RESUME_FALLBACKS
└─ package.json
```

---

## 9. Configuration & Environment

```
OPENROUTER_API_KEY=...          # server-only
RESUME_MODEL=qwen/qwen3-coder:free
RESUME_FALLBACKS=deepseek/deepseek-v4-flash:free,meta-llama/llama-3.3-70b:free
GEN_MAX_ATTEMPTS=3
GEN_CONCURRENCY=2               # respect 20 req/min free tier
```

Never import `OPENROUTER_API_KEY` into any client component. All model calls happen in `lib/*` invoked from route handlers only.

---

## 10. Error Handling

- **Typed StageError** carries the failing stage name; the route returns it as structured JSON; the UI maps it to the ErrorCard.
- **Retry:** the UI can re-POST with a `resumeFrom` stage hint; the orchestrator can skip completed stages where state is passed back (POC may simply re-run the whole job for simplicity).
- **Rate limits (429):** handled inside the OpenRouter client via fallback rotation before surfacing an error.
- **No secrets or stack traces** ever reach the client payload.

---

## 11. Testing Strategy

- **Unit (Vitest):** `computeTimeline` (multiple year/company combos), Zod schema parsing (valid/invalid), prompt assembly snapshots.
- **Manual fidelity:** generate the four reference profiles; diff visually against the originals.
- **Bake-off script:** `scripts/bakeoff.ts` runs one input across `qwen3-coder` / `deepseek-v4-flash` / `llama-3.3-70b` and dumps outputs for side-by-side review of repetition, tool accuracy, and format.

---

## 12. Security & Operational Notes

- Single trusted operator; primary risk is key leakage — keep it server-side, in env, out of the bundle.
- Free models can use prompts to improve their products and can change/disappear; treat the slug as config and avoid sending sensitive real PII through free tiers (use placeholders for contact fields).
- Generated content is domain-plausible scaffolding to be reviewed against real candidate history before any external use.

---

## 13. Next Steps

SM shards epics into `docs/epics/` (done in this suite) and drafts stories for dev. Begin Epic 1 (walking skeleton), then Epic 2 (engine), then Epic 3 (fidelity + UX).
