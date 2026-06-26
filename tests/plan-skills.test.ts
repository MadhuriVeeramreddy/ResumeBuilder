import { describe, expect, it } from "vitest";
import { buildSkillCategories } from "@/lib/plan-skills";

describe("buildSkillCategories", () => {
  it("builds categories from KB for Business Analyst with domains", () => {
    const categories = buildSkillCategories("Business Analyst", [
      "healthcare_payer",
      "pc_insurance",
      "banking",
    ]);
    expect(categories.length).toBeGreaterThanOrEqual(9);
    for (const cat of categories) {
      expect(cat.label.length).toBeGreaterThan(0);
      expect(cat.items.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("falls back for custom role titles", () => {
    const categories = buildSkillCategories("Senior Data Engineer", ["telecom"]);
    expect(categories.length).toBeGreaterThanOrEqual(6);
    expect(categories.every((c) => c.items.length >= 3)).toBe(true);
  });
});
