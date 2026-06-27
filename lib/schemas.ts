import { z } from "zod";

export const CompanyEndYearSchema = z.union([
  z.number().int().min(1970).max(2100),
  z.literal("present"),
]);

export const CompanySchema = z.object({
  name: z.string().min(1),
  country: z.string().min(1),
  startYear: z.number().int().min(1970).max(2100).optional(),
  endYear: CompanyEndYearSchema.optional(),
});

export const ContactSchema = z.object({
  city: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  linkedin: z.string().optional(),
});

export const GenerationInputSchema = z.object({
  name: z.string().min(1),
  role: z.string().min(1),
  yearsExperience: z.number().int().min(1).max(40),
  companies: z.array(CompanySchema).min(3).max(5),
  contact: ContactSchema.optional(),
  themeId: z.string().optional(),
});

export const RolePlanSchema = z.object({
  company: z.string(),
  location: z.string(),
  domainKey: z.string(),
  title: z.string(),
  specialization: z.string(),
});

export const PlanCallSchema = z.object({
  roles: z.array(RolePlanSchema).min(3).max(5),
});

export const GenerationPlanSchema = z.object({
  skillCategories: z
    .array(
      z.object({
        label: z.string(),
        items: z.array(z.string()).min(3),
      }),
    )
    .min(9)
    .max(11),
  roles: z.array(RolePlanSchema).min(3).max(5),
});

export const SummarySchema = z.object({
  opening: z.string().min(50),
  bullets: z.array(z.string().min(20)).min(12).max(18),
});

export const SummarySkillsSchema = SummarySchema.extend({
  skills: z
    .array(
      z.object({
        label: z.string(),
        items: z.array(z.string()).min(3),
      }),
    )
    .min(9)
    .max(11),
});

export const SkillsSchema = z.object({
  skills: z
    .array(
      z.object({
        label: z.string(),
        items: z.array(z.string()).min(3),
      }),
    )
    .min(9)
    .max(11),
});

export const RoleContentSchema = z.object({
  projectName: z.string(),
  intro: z.string().min(80),
  bullets: z.array(z.string().min(30)).min(18).max(22),
  environments: z.array(z.string()).min(8).max(25),
});

export const DateRangeSchema = z.object({
  start: z.string(),
  end: z.string(),
});

export const ResumeModelSchema = z.object({
  name: z.string(),
  title: z.string(),
  contact: ContactSchema,
  summary: SummarySchema,
  skills: z.array(
    z.object({
      label: z.string(),
      items: z.array(z.string()),
    }),
  ),
  education: z.array(z.string()).optional(),
  roles: z.array(
    RolePlanSchema.extend({
      projectName: z.string(),
      intro: z.string(),
      bullets: z.array(z.string()),
      environments: z.array(z.string()),
      dates: DateRangeSchema,
    }),
  ),
  themeId: z.string(),
});

export type Company = z.infer<typeof CompanySchema>;
export type Contact = z.infer<typeof ContactSchema>;
export type GenerationInput = z.infer<typeof GenerationInputSchema>;
export type RolePlan = z.infer<typeof RolePlanSchema>;
export type GenerationPlan = z.infer<typeof GenerationPlanSchema>;
export type SummaryContent = z.infer<typeof SummarySchema>;
export type SkillsContent = z.infer<typeof SkillsSchema>;
export type RoleContent = z.infer<typeof RoleContentSchema>;
export type DateRange = z.infer<typeof DateRangeSchema>;
export type ResumeModel = z.infer<typeof ResumeModelSchema>;

export const RenderRequestSchema = z.object({
  resume: ResumeModelSchema,
  themeId: z.string().optional(),
});
