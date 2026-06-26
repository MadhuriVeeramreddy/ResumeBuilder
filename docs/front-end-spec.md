# ResumeForge UI/UX Specification

**Author:** Madhuri (UX Expert hat)
**Date:** 2026-06-21
**Status:** Draft v1 — POC
**Source:** `docs/prd.md` §3

---

## 1. Introduction

This document defines the user experience for ResumeForge, an internal single-operator tool. The UX bar is deliberately minimal: one screen, one job, done fast. Polish is secondary to speed and clarity.

### UX Goals
- **Speed:** operator effort under ~2 minutes per resume.
- **Clarity:** always-visible state — what's happening, what failed, what to do next.
- **Trust:** the operator can tell when generation succeeded and the file is ready.

### Personas
- **The Operator (only persona):** you. Technical, trusted, repeat user. Knows the input pattern. Wants zero friction and no hand-holding.

### Usability Principles
1. One screen, one primary action.
2. Show progress per stage, never a blank spinner.
3. Fail loudly and recoverably — name the stage, offer retry.
4. No dead ends, no navigation depth.

---

## 2. Information Architecture

### Site Map
A single route.

```
/                → Generator (form + progress + download)
/api/generate    → server route handler (not a page)
/api/health      → server check (not a page)
```

No navigation, no auth screens, no settings page (config is env-based).

---

## 3. User Flows

### Flow: Generate a resume

**Goal:** From minimal input to a downloaded `.docx`.

```
[Operator opens /]
      │
      ▼
[Fills form: name, role, years, 4 companies, optional contacts]
      │  (light client validation: 4 companies present, years numeric)
      ▼
[Clicks Generate] ──► POST /api/generate
      │
      ▼
[Staged progress shown]
   Planning ─► Role 1 ─► Role 2 ─► Role 3 ─► Role 4 ─► Assembling ─► Ready
      │                          │
      │ (stage error)            ▼
      ▼                    [Download .docx]
[Error card: names failed stage + Retry]
```

**Edge cases**
- Rate limit (429): error card explains the model is busy; Retry re-runs the failed stage (or whole job).
- Empty/invalid model output after retries: error card names the stage; Retry available.
- Fewer/more than 4 companies: validation blocks submit with an inline hint.

---

## 4. Wireframes (low-fidelity)

### Generator screen — idle
```
┌────────────────────────────────────────────────────┐
│  ResumeForge                                         │
│  Internal resume generator                           │
│                                                      │
│  Candidate name      [____________________]          │
│  Target role/title   [____________________]          │
│  Total years         [____]                          │
│                                                      │
│  Companies (most recent first; India last)           │
│   1 [_______________]  Country [______]              │
│   2 [_______________]  Country [______]              │
│   3 [_______________]  Country [______]              │
│   4 [_______________]  Country [India ]              │
│                                                      │
│  ▸ Optional contact (city, email, phone, LinkedIn)   │
│                                                      │
│  Theme:                                              │
│   [Navy] [Sage] [Mono] [Burgundy] [Slate]            │
│   [Compact] [Banded] [Garamond]   (default: Navy)    │
│                                                      │
│             [  Generate resume  ]                    │
└────────────────────────────────────────────────────┘
```

### Generator screen — generating
```
┌────────────────────────────────────────────────────┐
│  Generating "Mamatha"…                               │
│                                                      │
│  ✓ Planning domains                                  │
│  ✓ Role 1 — Cigna (healthcare payer)                 │
│  ◐ Role 2 — Assurant (P&C insurance)                 │
│  · Role 3 — State of Ohio                            │
│  · Role 4 — ICICI Bank (banking)                     │
│  · Assembling document                               │
│                                                      │
│             [ Cancel ]                               │
└────────────────────────────────────────────────────┘
```

### Generator screen — ready / error
```
READY                                   ERROR
┌────────────────────────────┐          ┌───────────────────────────────┐
│  ✓ Resume ready             │          │ ⚠ Role 3 failed (rate limit)  │
│  Theme: [Navy ▾] (switch    │          │   The model is busy.          │
│         re-renders instantly)│          │   [ Retry Role 3 ]  [ Retry ] │
│  [ Download .docx ]         │          └───────────────────────────────┘
│  [ Generate another ]       │
└────────────────────────────┘
```

---

## 5. Component Inventory

- **TextField** — labeled single-line input (name, role, company, country, contacts).
- **NumberField** — years input with numeric validation.
- **CompanyRepeater** — fixed 4 rows (company + country), India hinted on the last.
- **CollapsibleSection** — optional contact fields.
- **ThemePicker** (core) — a row of 8 selectable theme cards, each showing an accent-color swatch, a small font sample, and the theme name; default `classic_navy`. Available before generation and after (switching re-renders instantly without re-generating). See `docs/theme-system.md`.
- **PrimaryButton** — Generate / Download / Generate another.
- **ProgressList** — staged checklist with states (pending · active · done · failed).
- **ErrorCard** — stage name + message + Retry actions.
- **Toast/inline validation** — form-level hints.

---

## 6. Branding & Style

- Neutral, clean, utilitarian. System font stack is fine.
- Single accent color for the primary action and active progress state.
- Generous whitespace; the form should feel short, not dense.
- No marketing chrome (it's internal).

---

## 7. Responsiveness, Accessibility, Performance

- **Responsiveness:** desktop-first; no mobile layout required for POC (but don't break on a narrow window).
- **Accessibility:** not mandated; keep labels real `<label>`s, adequate contrast, and focus states by default.
- **Performance:** the screen itself is trivial; perceived performance comes from the staged progress feedback during the ~60–90s generation.

---

## 8. Next Steps

Hand to Architect (`docs/architecture.md`) for the component/route implementation and to the SM for story drafting (Epic 3 covers the UI).
