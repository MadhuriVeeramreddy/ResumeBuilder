import type { ResumeTheme } from "./types";
import {
  bandedIndigo,
  classicNavy,
  compactPro,
  elegantGaramond,
  executiveBurgundy,
  minimalMono,
  modernSage,
  techSlate,
} from "./themes";

export const DEFAULT_THEME_ID = "classic_navy";

const themes: ResumeTheme[] = [
  classicNavy,
  modernSage,
  minimalMono,
  executiveBurgundy,
  techSlate,
  compactPro,
  bandedIndigo,
  elegantGaramond,
];

const byId = new Map(themes.map((t) => [t.id, t]));

export function getTheme(id?: string): ResumeTheme {
  if (id && byId.has(id)) return byId.get(id)!;
  return byId.get(DEFAULT_THEME_ID)!;
}

export function listThemes(): ResumeTheme[] {
  return themes;
}
