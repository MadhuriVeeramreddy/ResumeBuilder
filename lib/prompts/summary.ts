import type { GenerationInput, GenerationPlan } from "../schemas";
import { getDomainEntry, getRoleEntry } from "../kb";

export function buildSummarySkillsPrompt(input: GenerationInput, plan: GenerationPlan): string {
  const roleKb = getRoleEntry(input.role);
  const domainTools = plan.roles
    .map((r) => getDomainEntry(r.domainKey))
    .filter(Boolean)
    .flatMap((d) => d!.tools);

  return `Return ONLY valid JSON:
{
  "opening": string,
  "bullets": string[]
}

Generate the Summary section for a ${input.role} resume with ${input.yearsExperience}+ years experience.

Summary rules:
- "opening": ONE dense keyword-rich first-person sentence mentioning domains and many tools from the grounded list.
- "bullets": 12-18 items, each starting with a gerund (Gathering, Designing, Building, etc.). Embed 2-4 real tools per bullet. No duplicate opening verbs.

Grounded role base skills: ${JSON.stringify(roleKb?.baseSkills?.slice(0, 30) ?? [])}
Domain tools from plan: ${JSON.stringify([...new Set(domainTools)].slice(0, 40))}
Domains in plan: ${JSON.stringify(plan.roles.map((r) => r.domainKey))}`;
}
