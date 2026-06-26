# Project Brief: ResumeForge (Internal Resume Generator)

**Author:** Madhuri (Analyst hat)
**Date:** 2026-06-21
**Status:** Draft v1 — POC scope
**BMAD Phase:** Analyst → ready for PM (PRD)

---

## Executive Summary

ResumeForge is an internal, single-user web tool that turns a tiny structured input — candidate name, target role, total years of experience, and a list of four companies — into a polished, ATS-optimized, multi-page `.docx` resume that matches a fixed house style. It exists to remove the hours of manual drafting and formatting currently spent producing consultant/bench-style resumes for candidate placement. The tool infers each company's industry domain, pulls the correct domain-specific tool vocabulary from a curated knowledge base, generates varied keyword-dense experience content per role, computes a sensible employment timeline in code, and assembles a faithful `.docx` for download.

This is a POC: no authentication, no payments, no multi-tenancy. One operator (you), local/private deployment, generate-and-download.

## Problem Statement

Producing these resumes by hand is slow and repetitive. Each resume requires ~80 distinct experience bullets across four roles, a domain-matched skills section, a version-pinned "Environments" line per role, and a coherent timeline derived from a years-of-experience figure. Doing this manually for every candidate is time-consuming, error-prone (repetition, mismatched tools, overlapping dates), and inconsistent in formatting. The work is mechanical enough to automate but nuanced enough (domain vocabulary, non-repetition, template fidelity) that naive automation produces obviously templated, low-quality output.

## Proposed Solution

A Next.js web app with a minimal input form backed by a structured multi-call generation pipeline:

1. **Plan call** — infer each company's domain, choose skill categories, and define the generation plan.
2. **Per-role calls (×4)** — generate each role's project intro, ~20 varied bullets, and a version-pinned Environments line, grounded by a curated domain knowledge base.
3. **Deterministic assembly in code** — compute the employment timeline (split years across companies, India role oldest, end at "Present"), validate all model output against a JSON schema (retry on failure), and render a faithful `.docx` via the `docx` npm library from a parametrized template.

The curated **domain knowledge base** (domain → tools / version pins / project-name patterns) is the core quality lever and the project's defensible asset.

## Target Users

**Primary (and only, for POC):** You — the operator who places candidates and needs fast, consistent, high-quality resume drafts. Single user, trusted, internal.

There are no secondary user segments in scope for the POC.

## Goals & Success Metrics

**Business / operator objectives**
- Cut time-to-resume from ~hours to under ~2 minutes of operator effort per resume.
- Produce output that needs only light manual review, not a rewrite.

**Product success metrics (POC)**
- A resume generates end-to-end (input → downloadable `.docx`) in under ~90 seconds.
- Generated output matches the house template visually (header, sections, bullet style, Environments line).
- Across the four roles, bullet repetition is low and the tool vocabulary is domain-correct (no obviously wrong tools).

**Acceptance signal:** You generate resumes for the four reference profiles (Mamatha, Bhargavi, Vasu, Sharan) from minimal input and judge them "ship-quality with light edits."

## MVP Scope

**In scope (POC)**
- Minimal-fields input form (name, target role, years, four companies; optional contact placeholders).
- Domain inference + curated knowledge base for the domains present in the four reference resumes.
- Multi-call generation pipeline with JSON-schema validation and retry.
- Deterministic timeline computation in code.
- `.docx` assembly faithful to the house style; 1–2 selectable templates to start.
- Generate-and-download. Stateless is acceptable; light local persistence optional.
- OpenRouter integration using a free model (Qwen3 Coder) with a fallback chain.

**Out of scope (POC)**
- User accounts, login, roles, multi-tenancy.
- Payments / billing / subscriptions.
- Uploading or parsing an existing resume (minimal-fields generation only).
- Public/multi-user hosting, rate limiting for third parties.
- PDF export, LinkedIn import, analytics dashboards.

**MVP success criteria:** All four reference profiles generate clean, domain-correct, template-faithful `.docx` files from minimal input with light edits only.

## Post-MVP Vision

Possible later directions (not committed): more templates and a template picker; "minimal + optional real details" input to ground content in true history; existing-resume upload and restructure; a paid multi-user SaaS for recruiters with accounts and Razorpay; PDF export; a larger, maintained domain knowledge base spanning more industries.

## Technical Considerations

- **Platform:** Web (desktop-first; operator tool). Next.js (App Router) on Vercel.
- **Generation:** OpenRouter (OpenAI-compatible). POC model `qwen/qwen3-coder:free` with fallback to `deepseek/deepseek-v4-flash:free` and `meta-llama/llama-3.3-70b:free`.
- **Document assembly:** `docx` npm library, server-side, from a parametrized template.
- **Persistence:** None required for POC. The domain knowledge base ships as a versioned JSON file in the repo. Optional: Supabase for saving generated resumes later.
- **Determinism:** Date math and timeline logic live in code, never the model.
- **Reliability:** Strict JSON schema per model response + validate-and-retry; free-model rate limits (20 req/min, ~200/day) handled with a fallback chain.

## Constraints & Assumptions

- Single trusted operator; security surface is minimal (keep the OpenRouter key server-side only).
- Free-model availability changes weekly; the model slug is config-driven, not hardcoded.
- Each candidate has exactly four companies (3 US + 1 India), matching the reference pattern; the design should tolerate 3–5 but optimizes for 4.
- Output is a drafting/formatting accelerator. Generated experience is domain-plausible scaffolding intended to be reviewed and grounded against real candidate history before use, not a substitute for verified facts.

## Risks & Open Questions

- **Content repetition** across ~80 bullets — mitigated by per-role generation and explicit diversity instructions; needs validation.
- **Tool/version hallucination** — mitigated by the curated knowledge base; quality depends on how well it's seeded.
- **Template fidelity in `.docx`** — matching fonts/spacing/bold-run patterns exactly takes iteration.
- **Free-model quality/latency variance** — bake-off (Qwen3 Coder vs DeepSeek V4 Flash vs Llama 3.3 70B) needed to confirm the primary.
- **Open question:** how many distinct templates to support in POC (1 vs 2) — defaulting to 1 fully-faithful template, with a second as stretch.

## Next Steps

Hand off to PM to produce the PRD (`docs/prd.md`), then UX Expert (`docs/front-end-spec.md`) and Architect (`docs/architecture.md`). Epics sharded into `docs/epics/`. Domain knowledge base seeded in `docs/domain-knowledge-base.json`.
