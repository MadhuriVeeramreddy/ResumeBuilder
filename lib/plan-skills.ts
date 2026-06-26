import { getDomainEntry, getRoleEntry, loadKnowledgeBase, type RoleEntry } from "./kb";

export type SkillCategory = { label: string; items: string[] };

function getRoleEntryOrFallback(role: string): RoleEntry {
  const exact = getRoleEntry(role);
  if (exact) return exact;

  const lower = role.toLowerCase();
  const kb = loadKnowledgeBase();
  if (lower.includes("data") && lower.includes("anal")) return kb.roles["Data Analyst"];
  if (lower.includes("c++") || lower.includes("developer") || lower.includes("engineer")) {
    return kb.roles["C++ Developer"];
  }
  return kb.roles["Business Analyst"];
}

function splitSkillsAcrossLabels(skills: string[], labels: string[]): SkillCategory[] {
  if (labels.length === 0) {
    return [{ label: "Core Skills", items: skills.slice(0, 12) }];
  }

  const chunkSize = Math.max(3, Math.ceil(skills.length / labels.length));
  return labels.map((label, index) => ({
    label,
    items: skills.slice(index * chunkSize, (index + 1) * chunkSize).filter(Boolean),
  }));
}

function ensureMinItems(items: string[], pool: string[], min = 3): string[] {
  if (items.length >= min) return items;
  const extras = pool.filter((item) => !items.includes(item));
  return [...items, ...extras].slice(0, Math.max(min, items.length));
}

/** Deterministic skill-category scaffold for the plan — never trust the LLM for item lists here. */
export function buildSkillCategories(role: string, domainKeys: string[]): SkillCategory[] {
  const roleEntry = getRoleEntryOrFallback(role);
  const pool = [...roleEntry.baseSkills];
  const categories = splitSkillsAcrossLabels(pool, roleEntry.categories);

  const seen = new Set(categories.map((c) => c.label.toLowerCase()));
  for (const key of [...new Set(domainKeys)]) {
    const domain = getDomainEntry(key);
    if (!domain) continue;
    const { skillCategory } = domain;
    if (seen.has(skillCategory.label.toLowerCase())) continue;
    seen.add(skillCategory.label.toLowerCase());
    categories.push({
      label: skillCategory.label,
      items: [...skillCategory.items],
    });
  }

  const normalized = categories
    .map((cat) => ({
      label: cat.label,
      items: ensureMinItems(cat.items, pool),
    }))
    .filter((cat) => cat.items.length > 0);

  while (normalized.length < 9 && roleEntry.categories.length > 0) {
    const label = roleEntry.categories[normalized.length % roleEntry.categories.length];
    if (!normalized.some((c) => c.label === label)) {
      normalized.push({
        label: `${label} (Additional)`,
        items: pool.slice(0, 6),
      });
    } else {
      break;
    }
  }

  return normalized.slice(0, 11);
}
