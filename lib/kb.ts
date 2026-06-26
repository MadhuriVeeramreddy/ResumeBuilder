import { readFileSync } from "fs";
import path from "path";
import { z } from "zod";

const SkillCategorySchema = z.object({
  label: z.string(),
  items: z.array(z.string()),
});

const DomainEntrySchema = z.object({
  label: z.string(),
  companyHints: z.array(z.string()).optional(),
  tools: z.array(z.string()),
  environments: z.array(z.string()),
  projectPatterns: z.array(z.string()),
  skillCategory: SkillCategorySchema,
});

const RoleEntrySchema = z.object({
  titles: z.array(z.string()).optional(),
  baseSkills: z.array(z.string()),
  categories: z.array(z.string()),
});

const KnowledgeBaseSchema = z.object({
  roles: z.record(RoleEntrySchema),
  domains: z.record(DomainEntrySchema),
  indiaOffshoreHints: z.array(z.string()).optional(),
});

export type DomainEntry = z.infer<typeof DomainEntrySchema>;
export type RoleEntry = z.infer<typeof RoleEntrySchema>;
export type KnowledgeBase = z.infer<typeof KnowledgeBaseSchema>;

let cachedKb: KnowledgeBase | null = null;

export function loadKnowledgeBase(): KnowledgeBase {
  if (cachedKb) return cachedKb;
  const kbPath = path.join(process.cwd(), "docs", "domain-knowledge-base.json");
  const raw = readFileSync(kbPath, "utf-8");
  cachedKb = KnowledgeBaseSchema.parse(JSON.parse(raw));
  return cachedKb;
}

export function getDomainKeys(): string[] {
  return Object.keys(loadKnowledgeBase().domains);
}

export function getDomainEntry(key: string): DomainEntry | undefined {
  return loadKnowledgeBase().domains[key];
}

export function getRoleEntry(role: string): RoleEntry | undefined {
  return loadKnowledgeBase().roles[role];
}

export function inferDomainFromCompany(company: string, role: string): string {
  const kb = loadKnowledgeBase();
  const normalized = company.toLowerCase();

  for (const [key, domain] of Object.entries(kb.domains)) {
    const hints = domain.companyHints ?? [];
    if (hints.some((hint) => normalized.includes(hint.toLowerCase()))) {
      return key;
    }
  }

  const roleDefaults: Record<string, string> = {
    "Business Analyst": "healthcare_payer",
    "Data Analyst": "healthcare_payer",
    "C++ Developer": "automotive_embedded",
  };

  return roleDefaults[role] ?? Object.keys(kb.domains)[0];
}

export function isIndiaCompany(country: string, company: string): boolean {
  const kb = loadKnowledgeBase();
  const normalizedCountry = country.toLowerCase();
  if (normalizedCountry.includes("india")) return true;
  const normalizedCompany = company.toLowerCase();
  return (kb.indiaOffshoreHints ?? []).some((hint) => normalizedCompany.includes(hint));
}

export function kbSummaryForPrompt(): string {
  const kb = loadKnowledgeBase();
  const domains = Object.entries(kb.domains).map(([key, d]) => ({
    key,
    label: d.label,
    hints: d.companyHints?.slice(0, 5) ?? [],
    tools: d.tools.slice(0, 12),
    environments: d.environments.slice(0, 10),
    projectPatterns: d.projectPatterns,
  }));
  return JSON.stringify({ domains, roles: Object.keys(kb.roles) }, null, 2);
}
