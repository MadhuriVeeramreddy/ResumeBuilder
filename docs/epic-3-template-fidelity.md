# Epic 3 — Template Fidelity, Themes & Operator UX

**Source:** `docs/prd.md` §6 · **UX:** `docs/front-end-spec.md` · **Architecture:** `docs/architecture.md` §7 · **Themes:** `docs/theme-system.md`
**Goal:** Make output indistinguishable from the house style, offer 8 ATS-safe themes, and give the operator a fast, clear console.

**Sequencing:** 3.1 → 3.5 (theme system) → 3.2 → 3.6 (theme picker) → 3.3 → 3.4. Build the theme registry right after the faithful renderer (3.1) so the picker (3.6) and reference validation (3.4) exercise all themes.

---

## Story 3.1 — Faithful `.docx` template
**As** the operator, **I want** the `.docx` to match the reference resumes, **so that** output needs no reformatting.

**Acceptance Criteria**
1. `lib/docx/templates/classic.ts` reproduces: name header + contact line; section headings (uppercase + bottom rule); Summary (opening paragraph + bullets); Skills (bold label: items); per-role header line (**Company** · Location / **Title — Specialization** *| dates*) with correct bold+italic runs; bullets; **Environments:** line.
2. Visual comparison against two references (e.g., Mamatha + Sharan) shows matching structure and styling.
3. Opens cleanly in Word and Google Docs.

**Dev Notes:** Keep per-template spacing/fonts/colors in a config object so a new template is data, not new rendering code.

---

## Story 3.2 — Operator generator screen
**As** the operator, **I want** a single-screen form with staged progress, **so that** generating is fast and legible.

**Acceptance Criteria**
1. Form captures name, role, years, 4 companies (+ optional contacts) with light validation (4 companies, numeric years).
2. Submit shows staged progress (Planning → Role 1–4 → Assembling → Ready) per `front-end-spec.md`.
3. On success, a Download button delivers the `.docx`; a "Generate another" resets the form.
4. Usable on a desktop browser.

---

## Story 3.3 — Error handling & retry
**As** the operator, **I want** clear errors and one-click retry, **so that** free-tier hiccups don't block me.

**Acceptance Criteria**
1. Rate-limit/model failures show a readable message naming the failed stage.
2. Retry re-runs the failed stage where feasible, else the whole job.
3. No raw stack traces or keys appear in the UI.

---

## Story 3.4 — Reference validation pass
**As** the operator, **I want** to regenerate all four reference profiles, **so that** I can confirm ship-quality.

**Acceptance Criteria**
1. Generating Mamatha, Bhargavi, Vasu, Sharan from minimal input yields template-faithful, domain-correct `.docx` files.
2. Each profile is spot-checked across all 8 themes for clean rendering and ATS-safety.
3. Bullet repetition and tool correctness judged acceptable (light edits only).
4. Findings feed back into KB/prompts/themes (logged as follow-up tweaks).

**Dev Notes:** Use `scripts/bakeoff.ts` to also compare models on one profile and lock the primary.

---

## Story 3.5 — Theme system & registry (8 themes)
**As** the operator, **I want** 8 distinct, ATS-safe themes, **so that** I can match different house styles.

**Acceptance Criteria**
1. `lib/themes/types.ts` (`ResumeTheme`) + `lib/themes/registry.ts` (`getTheme`, `DEFAULT_THEME_ID`) + 8 token files per `docs/theme-system.md`.
2. The single `assemble.ts` renderer reads all styling from the active theme; unknown `themeId` falls back to default.
3. Each of the 8 themes renders the same `ResumeModel` to a valid `.docx` opening cleanly in Word and Google Docs.
4. Every theme is single-column and ATS-safe (NFR9): Office-standard fonts, no text boxes/images/layout tables, color only on name/headings/rules.

**Dev Notes:** Token values are seeded in `docs/theme-system.md` §4; tune against rendered output. Remember `docx` units (half-points, twips).

---

## Story 3.6 — Theme picker UI & instant re-render
**As** the operator, **I want** to pick a theme and switch it after generating, **so that** browsing looks is fast and free.

**Acceptance Criteria**
1. Generator screen shows 8 theme cards (accent swatch + font sample + name); default `classic_navy`; selection sets `themeId` on the request.
2. After generation, changing theme re-renders the cached `ResumeModel` and offers a fresh download **without** another LLM call.
3. Each theme yields a correctly named, valid `.docx`.

**Dev Notes:** Cache the `ResumeModel` client- or server-side after first generation so theme changes only re-run `assemble.ts`.

---

**Definition of Done (Epic 3):** All four reference profiles generate ship-quality, template-faithful `.docx` files across all 8 ATS-safe themes through a clean operator console, with post-generation theme switching that needs no re-generation.
