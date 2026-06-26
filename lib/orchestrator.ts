import { getServerConfig } from "./config";
import { resolveContact } from "./contact";
import { StageError, type GenerationStage } from "./errors";
import {
  getDomainKeys,
  inferDomainFromCompany,
  isIndiaCompany,
} from "./kb";
import { buildSkillCategories } from "./plan-skills";
import { buildPlanPrompt, fallbackLocation } from "./prompts/plan";
import {
  buildRolePrompt,
  collectUsedTools,
  extractOpeningVerb,
  roleStageForIndex,
} from "./prompts/role";
import { buildSummarySkillsPrompt } from "./prompts/summary";
import {
  GenerationInputSchema,
  PlanCallSchema,
  ResumeModel,
  ResumeModelSchema,
  RoleContentSchema,
  SummarySchema,
  type GenerationPlan,
  type GenerationInput as GenInput,
  type RolePlan,
} from "./schemas";
import { structuredGenerate } from "./structured";
import { computeTimeline } from "./timeline";
import { DEFAULT_THEME_ID } from "./themes/registry";

export type ProgressEvent = {
  stage: GenerationStage;
  status: "running" | "done" | "error";
  detail?: string;
};

export type OrchestratorOptions = {
  onProgress?: (event: ProgressEvent) => void;
};

async function runStage<T>(
  stage: GenerationStage,
  fn: () => Promise<T>,
  onProgress?: (event: ProgressEvent) => void,
): Promise<T> {
  onProgress?.({ stage, status: "running" });
  try {
    const result = await fn();
    onProgress?.({ stage, status: "done" });
    return result;
  } catch (error) {
    onProgress?.({
      stage,
      status: "error",
      detail: error instanceof Error ? error.message : "Unknown error",
    });
    if (error instanceof StageError) throw error;
    throw new StageError(stage, undefined, error);
  }
}

function normalizePlan(input: GenInput, planRoles: RolePlan[]): GenerationPlan {
  const allowedDomains = new Set(getDomainKeys());
  const roles = input.companies.map((company, index) => {
    const role = planRoles[index] ?? planRoles[planRoles.length - 1];
    const inferred = inferDomainFromCompany(company.name, input.role);
    const isIndia = isIndiaCompany(company.country, company.name);
    return {
      company: company.name,
      location: role?.location || fallbackLocation(company.country, index, isIndia),
      domainKey: role && allowedDomains.has(role.domainKey) ? role.domainKey : inferred,
      title: role?.title ?? (index === 0 ? `Senior ${input.role}` : input.role),
      specialization: role?.specialization ?? "Modernization",
    };
  });

  return {
    skillCategories: buildSkillCategories(input.role, roles.map((r) => r.domainKey)),
    roles,
  };
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const current = nextIndex++;
      results[current] = await mapper(items[current], current);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

export async function generateResumeModel(
  input: GenInput,
  options: OrchestratorOptions = {},
): Promise<ResumeModel> {
  const parsed = GenerationInputSchema.parse(input);
  const { onProgress } = options;
  const config = getServerConfig();

  const planCall = await runStage(
    "planning",
    () =>
      structuredGenerate(buildPlanPrompt(parsed), PlanCallSchema, {
        stage: "planning",
        system:
          "You output strict JSON only. Use knowledge-base domain keys. Never invent tool names outside the provided lists.",
      }),
    onProgress,
  );

  const normalizedPlan = normalizePlan(parsed, planCall.roles);

  const timeline = await runStage(
    "timeline",
    async () => computeTimeline(parsed.yearsExperience, parsed.companies.length),
    onProgress,
  );

  const summary = await runStage(
    "summary_skills",
    () =>
      structuredGenerate(buildSummarySkillsPrompt(parsed, normalizedPlan), SummarySchema, {
        stage: "summary_skills",
      }),
    onProgress,
  );

  let usedVerbs: string[] = summary.bullets.map(extractOpeningVerb).filter(Boolean);
  let usedTools: string[] = collectUsedTools(summary.bullets, []);

  const roleContents = await mapWithConcurrency(
    normalizedPlan.roles,
    config.concurrency,
    async (rolePlan, index) => {
      const stage = roleStageForIndex(index);
      return runStage(
        stage,
        () =>
          structuredGenerate(
            buildRolePrompt(parsed.role, rolePlan, usedVerbs, usedTools),
            RoleContentSchema,
            { stage },
          ),
        onProgress,
      ).then((content) => {
        usedVerbs = [...usedVerbs, ...content.bullets.map(extractOpeningVerb)];
        usedTools = [...usedTools, ...collectUsedTools(content.bullets, content.environments)];
        return content;
      });
    },
  );

  const resume: ResumeModel = {
    name: parsed.name,
    title: parsed.role,
    contact: resolveContact(parsed.contact),
    summary: {
      opening: summary.opening,
      bullets: summary.bullets,
    },
    skills: normalizedPlan.skillCategories,
    roles: normalizedPlan.roles.map((rolePlan, index) => ({
      ...rolePlan,
      ...roleContents[index],
      dates: timeline[index],
    })),
    themeId: parsed.themeId ?? DEFAULT_THEME_ID,
  };

  return ResumeModelSchema.parse(resume);
}
