# ResumeForge Theme System

**Author:** Madhuri (Architect + UX)
**Date:** 2026-06-21
**Status:** Draft v1 — POC (core feature)
**Source:** `docs/prd.md` (FR14), `docs/architecture.md` §7

---

## 1. Concept

A **theme** is a pure presentation layer applied to the same generated `ResumeModel`. Content (summary, skills, roles, bullets, environments, timeline) is identical across themes; only the *look* changes — fonts, colors, name treatment, section-heading style, rules, bullet glyph, and spacing.

This keeps the design clean: **one content model, N themes.** Adding a theme is data (a token object), not new rendering logic. The renderer reads theme tokens and styles the `docx` document accordingly.

The POC ships **8 themes** (you can enable any 5–8). All are single-column and ATS-safe by construction.

## 2. ATS-safety rules (apply to every theme)

To keep "meets all standards" true, every theme must obey:
- **Single column.** No multi-column layouts, no sidebars.
- **No text boxes, no images, no icons, no tables for layout.** (The name band in Theme 7 uses paragraph shading, not a text box — text stays real and selectable.)
- **Office-standard fonts only** (so `.docx` renders identically without font embedding): Calibri, Cambria, Georgia, Garamond, Arial, Times New Roman, Tahoma, Verdana, Book Antiqua, Corbel, Constantia, Candara.
- **Color used only** on the name, section headings, and rules — never on body text needed by parsers.
- **Real heading paragraphs and real bullet lists** (not manual glyphs typed into a line) so structure is machine-readable.

## 3. Theme token schema

```ts
type ResumeTheme = {
  id: string;
  name: string;
  description: string;
  fonts: { heading: string; body: string };
  sizes: { name: number; sectionHeading: number; roleTitle: number; body: number; small: number }; // points
  colors: {
    name: string;     // hex
    accent: string;   // headings / rules
    heading: string;  // section heading text
    body: string;     // body text
    rule: string;     // divider color
    link: string;     // hyperlinks
  };
  nameAlign: "left" | "center";
  nameCase: "normal" | "upper";
  sectionHeadingCase: "upper" | "title";
  sectionRule: "full" | "short" | "none"; // bottom border under section headings
  nameRule: "full" | "none";              // divider under the name/contact header
  nameBand: boolean;                       // colored shaded band behind the name block
  bulletGlyph: "•" | "–" | "▪" | "◦" | "»";
  spacing: { line: number; paraAfter: number; sectionBefore: number }; // points
  margins: { top: number; bottom: number; left: number; right: number }; // inches
};
```

A theme is registered in `lib/themes/registry.ts`; the assembler picks it by `resume.themeId` and falls back to the default theme if unknown.

## 4. The 8 themes

| # | id | Name | Font (head / body) | Accent | Name | Headings | Rule | Bullet | Feel |
|---|----|------|--------------------|--------|------|----------|------|--------|------|
| 1 | `classic_navy` | Classic Navy | Cambria / Cambria | Navy `#1F3864` | Centered, normal | UPPER | full | • | Conservative, corporate (matches Mamatha) |
| 2 | `modern_sage` | Modern Sage | Corbel / Calibri | Sage `#4F6F52` | Left, normal | Title | short | ▪ | Clean modern (matches Sharan) |
| 3 | `minimal_mono` | Minimal Mono | Arial / Arial | none `#333333` | Left, UPPER | UPPER | full (thin) | – | Ultra-clean, max ATS-safe |
| 4 | `executive_burgundy` | Executive Burgundy | Georgia / Georgia | Burgundy `#6E1423` | Centered, normal | UPPER | full | • | Formal, senior |
| 5 | `tech_slate` | Tech Slate | Calibri / Calibri | Slate-teal `#2C5F6F` | Left, normal | UPPER | short | » | Developer-friendly, slightly denser |
| 6 | `compact_pro` | Compact Pro | Calibri / Calibri | Indigo `#27406B` | Left, normal | UPPER | none | • | Tight spacing, fits long careers |
| 7 | `banded_indigo` | Banded Indigo | Corbel / Calibri | Indigo `#34406B` | Left, normal, **band** | UPPER | none | ◦ | Design-forward header band |
| 8 | `elegant_garamond` | Elegant Garamond | Garamond / Book Antiqua | Gold `#8A6D3B` | Centered, normal | UPPER | short | • | Refined, editorial |

### Per-theme tokens (indicative values)

```jsonc
// classic_navy
{ "fonts": {"heading":"Cambria","body":"Cambria"},
  "sizes": {"name":26,"sectionHeading":12,"roleTitle":11,"body":10.5,"small":9},
  "colors": {"name":"#1F3864","accent":"#1F3864","heading":"#1F3864","body":"#1A1A1A","rule":"#1F3864","link":"#1F3864"},
  "nameAlign":"center","nameCase":"normal","sectionHeadingCase":"upper",
  "sectionRule":"full","nameRule":"full","nameBand":false,"bulletGlyph":"•",
  "spacing": {"line":1.08,"paraAfter":4,"sectionBefore":10}, "margins": {"top":0.7,"bottom":0.7,"left":0.8,"right":0.8} }

// modern_sage
{ "fonts": {"heading":"Corbel","body":"Calibri"},
  "sizes": {"name":30,"sectionHeading":13,"roleTitle":11,"body":10.5,"small":9},
  "colors": {"name":"#4F6F52","accent":"#4F6F52","heading":"#4F6F52","body":"#222222","rule":"#C8D2C2","link":"#4F6F52"},
  "nameAlign":"left","nameCase":"normal","sectionHeadingCase":"title",
  "sectionRule":"short","nameRule":"full","nameBand":false,"bulletGlyph":"▪",
  "spacing": {"line":1.1,"paraAfter":4,"sectionBefore":10}, "margins": {"top":0.7,"bottom":0.7,"left":0.85,"right":0.85} }

// minimal_mono
{ "fonts": {"heading":"Arial","body":"Arial"},
  "sizes": {"name":24,"sectionHeading":11,"roleTitle":11,"body":10.5,"small":9},
  "colors": {"name":"#333333","accent":"#333333","heading":"#333333","body":"#333333","rule":"#BBBBBB","link":"#333333"},
  "nameAlign":"left","nameCase":"upper","sectionHeadingCase":"upper",
  "sectionRule":"full","nameRule":"full","nameBand":false,"bulletGlyph":"–",
  "spacing": {"line":1.12,"paraAfter":4,"sectionBefore":9}, "margins": {"top":0.75,"bottom":0.75,"left":0.9,"right":0.9} }

// executive_burgundy
{ "fonts": {"heading":"Georgia","body":"Georgia"},
  "sizes": {"name":26,"sectionHeading":12,"roleTitle":11,"body":10.5,"small":9},
  "colors": {"name":"#6E1423","accent":"#6E1423","heading":"#6E1423","body":"#1A1A1A","rule":"#6E1423","link":"#6E1423"},
  "nameAlign":"center","nameCase":"normal","sectionHeadingCase":"upper",
  "sectionRule":"full","nameRule":"full","nameBand":false,"bulletGlyph":"•",
  "spacing": {"line":1.1,"paraAfter":4,"sectionBefore":10}, "margins": {"top":0.7,"bottom":0.7,"left":0.85,"right":0.85} }

// tech_slate
{ "fonts": {"heading":"Calibri","body":"Calibri"},
  "sizes": {"name":28,"sectionHeading":12,"roleTitle":11,"body":10,"small":8.5},
  "colors": {"name":"#2C5F6F","accent":"#2C5F6F","heading":"#2C5F6F","body":"#1F1F1F","rule":"#B7C9CE","link":"#2C5F6F"},
  "nameAlign":"left","nameCase":"normal","sectionHeadingCase":"upper",
  "sectionRule":"short","nameRule":"full","nameBand":false,"bulletGlyph":"»",
  "spacing": {"line":1.06,"paraAfter":3,"sectionBefore":9}, "margins": {"top":0.65,"bottom":0.65,"left":0.8,"right":0.8} }

// compact_pro
{ "fonts": {"heading":"Calibri","body":"Calibri"},
  "sizes": {"name":24,"sectionHeading":11,"roleTitle":10.5,"body":10,"small":8.5},
  "colors": {"name":"#27406B","accent":"#27406B","heading":"#27406B","body":"#202020","rule":"#27406B","link":"#27406B"},
  "nameAlign":"left","nameCase":"normal","sectionHeadingCase":"upper",
  "sectionRule":"none","nameRule":"full","nameBand":false,"bulletGlyph":"•",
  "spacing": {"line":1.0,"paraAfter":2,"sectionBefore":7}, "margins": {"top":0.55,"bottom":0.55,"left":0.7,"right":0.7} }

// banded_indigo
{ "fonts": {"heading":"Corbel","body":"Calibri"},
  "sizes": {"name":28,"sectionHeading":12,"roleTitle":11,"body":10.5,"small":9},
  "colors": {"name":"#FFFFFF","accent":"#34406B","heading":"#34406B","body":"#222222","rule":"#34406B","link":"#34406B"},
  "nameAlign":"left","nameCase":"normal","sectionHeadingCase":"upper",
  "sectionRule":"none","nameRule":"none","nameBand":true,"bulletGlyph":"◦",
  "spacing": {"line":1.1,"paraAfter":4,"sectionBefore":10}, "margins": {"top":0.6,"bottom":0.7,"left":0.85,"right":0.85} }

// elegant_garamond
{ "fonts": {"heading":"Garamond","body":"Book Antiqua"},
  "sizes": {"name":28,"sectionHeading":12,"roleTitle":11,"body":11,"small":9.5},
  "colors": {"name":"#2B2B2B","accent":"#8A6D3B","heading":"#2B2B2B","body":"#2B2B2B","rule":"#8A6D3B","link":"#8A6D3B"},
  "nameAlign":"center","nameCase":"normal","sectionHeadingCase":"upper",
  "sectionRule":"short","nameRule":"full","nameBand":false,"bulletGlyph":"•",
  "spacing": {"line":1.12,"paraAfter":4,"sectionBefore":11}, "margins": {"top":0.8,"bottom":0.8,"left":0.9,"right":0.9} }
```

> Values are starting points — tune against the rendered output. Sizes are points; in `docx`, font size is set in half-points (multiply by 2) and borders/spacing in twips (1 pt = 20 twips, 1 inch = 1440 twips).

## 5. How the renderer applies a theme

`lib/docx/assemble.ts` is theme-agnostic: it walks the `ResumeModel` and, for each element, reads styling from the active `ResumeTheme`:

- **Document defaults:** page margins from `theme.margins`; default body run = `theme.fonts.body`, `theme.sizes.body`, `theme.colors.body`; line spacing from `theme.spacing.line`.
- **Name block:** `theme.fonts.heading`, `theme.sizes.name`, `theme.colors.name`, aligned per `nameAlign`, uppercased if `nameCase==="upper"`. If `nameBand`, wrap the name+contact paragraphs with paragraph shading = `theme.colors.accent` and white text.
- **Section heading:** `theme.colors.heading`, `theme.sizes.sectionHeading`, bold, cased per `sectionHeadingCase`; bottom border = `theme.colors.rule` when `sectionRule!=="none"` (`short` = partial width via a trailing tab/right indent, `full` = full width).
- **Role header line:** company bold, title bold + specialization, dates italic in `theme.colors.body`.
- **Bullets:** real list paragraphs using `theme.bulletGlyph`; spacing from `theme.spacing.paraAfter`.
- **Environments line:** bold "Environments:" label + body run.

Because everything is token-driven, themes are unit-testable: render the same `ResumeModel` with each theme and assert no exceptions + a valid `.docx` buffer.

## 6. Source-tree additions

```
lib/themes/
├─ types.ts          # ResumeTheme
├─ registry.ts       # id -> ResumeTheme, getTheme(id), DEFAULT_THEME_ID
└─ themes/
   ├─ classic-navy.ts
   ├─ modern-sage.ts
   ├─ minimal-mono.ts
   ├─ executive-burgundy.ts
   ├─ tech-slate.ts
   ├─ compact-pro.ts
   ├─ banded-indigo.ts
   └─ elegant-garamond.ts
```

(Replaces the earlier `docx/templates/*` placeholder — themes are tokens consumed by one renderer, not separate renderers.)

## 7. Theme picker (UX)

The generator screen shows a **ThemePicker**: a row of selectable cards, each a small visual swatch (accent color block + font sample + name) with the theme name. Default selected = `classic_navy`. Selection sets `themeId` on the generation request. Optional: a "Surprise me" that picks at random. Picking a theme does **not** re-run generation — only re-renders the existing `ResumeModel`, so switching themes after generation is instant (cache the model, re-assemble on theme change). This makes theme browsing cheap and is a strong reason to keep content and presentation separate.

## 8. Acceptance

- All 8 themes render the same `ResumeModel` to a valid `.docx` that opens cleanly in Word and Google Docs.
- Each theme is visually distinct yet single-column and ATS-safe.
- Switching themes after generation re-renders without another LLM call.
