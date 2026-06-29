import type { ResumeTemplate } from "./types";
import { ALL_TEMPLATES, kishanBa } from "./templates";

export const DEFAULT_THEME_ID = "kishan_ba";

const byId = new Map<string, ResumeTemplate>(ALL_TEMPLATES.map((t) => [t.id, t]));

export function getTheme(id?: string): ResumeTemplate {
  if (id && byId.has(id)) return byId.get(id)!;
  return byId.get(DEFAULT_THEME_ID) ?? kishanBa;
}

export function listThemes(): ResumeTemplate[] {
  return ALL_TEMPLATES;
}
