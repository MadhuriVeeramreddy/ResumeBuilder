import { describe, expect, it } from "vitest";
import { stripCodeFences } from "@/lib/structured";
import { GenerationPlanSchema, PlanCallSchema, RoleContentSchema } from "@/lib/schemas";

describe("stripCodeFences", () => {
  it("removes json fences", () => {
    expect(stripCodeFences('```json\n{"a":1}\n```')).toBe('{"a":1}');
  });
});

describe("schemas", () => {
  it("parses a plan call with roles only", () => {
    const plan = PlanCallSchema.parse({
      roles: Array.from({ length: 4 }, (_, i) => ({
        company: `Co ${i}`,
        location: "NY",
        domainKey: "banking",
        title: "Analyst",
        specialization: "Modernization",
      })),
    });
    expect(plan.roles).toHaveLength(4);
  });

  it("parses a full generation plan with skill categories", () => {
    const plan = GenerationPlanSchema.parse({
      skillCategories: Array.from({ length: 9 }, (_, i) => ({
        label: `Category ${i + 1}`,
        items: ["A", "B", "C"],
      })),
      roles: Array.from({ length: 4 }, (_, i) => ({
        company: `Co ${i}`,
        location: "NY",
        domainKey: "banking",
        title: "Analyst",
        specialization: "Modernization",
      })),
    });
    expect(plan.roles).toHaveLength(4);
  });

  it("rejects short role content", () => {
    expect(() =>
      RoleContentSchema.parse({
        projectName: "Test",
        intro: "short",
        bullets: [],
        environments: [],
      }),
    ).toThrow();
  });
});
