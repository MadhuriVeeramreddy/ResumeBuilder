import type { GenerationPlan, RolePlan } from "../schemas";
import { getDomainEntry, getRoleEntry } from "../kb";

export function extractOpeningVerb(bullet: string): string {
  const match = bullet.trim().match(/^([A-Za-z]+)/);
  return match?.[1]?.toLowerCase() ?? "";
}

export function buildRolePrompt(
  role: string,
  rolePlan: RolePlan,
  usedVerbs: string[],
  usedTools: string[],
): string {
  const domain = getDomainEntry(rolePlan.domainKey);
  const roleKb = getRoleEntry(role);

  if (!domain) {
    throw new Error(`Unknown domain key: ${rolePlan.domainKey}`);
  }

  return `Return ONLY valid JSON:
{
  "projectName": string,
  "intro": string,
  "bullets": string[],
  "environments": string[]
}

Generate experience content for this role block:
Company: ${rolePlan.company}
Location: ${rolePlan.location}
Title: ${rolePlan.title}
Specialization: ${rolePlan.specialization}
Domain: ${domain.label} (${rolePlan.domainKey})

Rules:
- projectName: pick from or closely match: ${JSON.stringify(domain.projectPatterns)}
- intro: ONE dense paragraph (4-6 sentences) naming the project and embedding many domain tools naturally.
- bullets: 18-22 varied bullets. Each bullet 1-2 sentences, embedding 3-5 tools from the grounded lists. Start with action verbs (not gerunds). Avoid repeating opening verbs already used: ${JSON.stringify(usedVerbs.slice(-40))}
- Avoid overusing these tools: ${JSON.stringify(usedTools.slice(-30))}
- environments: 12-20 version-pinned items from ONLY this list: ${JSON.stringify(domain.environments)}
- Use tools ONLY from: ${JSON.stringify(domain.tools.slice(0, 25))} and role base: ${JSON.stringify(roleKb?.baseSkills?.slice(0, 20) ?? [])}
- Do NOT invent tool names or versions not in the grounded lists.`;
}

export function collectUsedTools(bullets: string[], environments: string[]): string[] {
  return [...new Set([...bullets.join(" ").match(/\b[A-Z][A-Za-z0-9+./\- ]{1,40}\b/g) ?? [], ...environments])];
}

export type RoleStageIndex = 1 | 2 | 3 | 4 | 5;

export function roleStageForIndex(index: number): `role_${RoleStageIndex}` {
  return `role_${Math.min(index + 1, 5) as RoleStageIndex}`;
}

export function planRoleOrder(plan: GenerationPlan): RolePlan[] {
  return plan.roles;
}
