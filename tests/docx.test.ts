import { describe, expect, it } from "vitest";
import { assembleDocx, resumeFilename } from "@/lib/docx/assemble";
import type { ResumeModel } from "@/lib/schemas";

const mockResume: ResumeModel = {
  name: "Test Candidate",
  title: "Business Analyst",
  contact: {},
  summary: {
    opening:
      "I bring 10 years of Business Analyst experience across healthcare payer and banking domains, specializing in BRD, FRD, RTM, JIRA, and SQL Server delivery.",
    bullets: Array.from({ length: 12 }, (_, i) =>
      `Gathering requirements for initiative ${i + 1} using JIRA, Confluence, and structured workshops across payer operations.`,
    ),
  },
  skills: Array.from({ length: 9 }, (_, i) => ({
    label: `Category ${i + 1}`,
    items: ["Tool A", "Tool B", "Tool C"],
  })),
  roles: [
    {
      company: "Cigna",
      location: "Jersey City, NJ",
      domainKey: "healthcare_payer",
      title: "Senior Business Analyst",
      specialization: "Payer Modernization",
      projectName: "Payer Modernization",
      intro:
        "Built a healthcare payer modernization platform for claims intake, enrollment governance, and provider network accuracy using Facets, QNXT, HIPAA, and SQL Server.",
      bullets: Array.from({ length: 18 }, (_, i) =>
        `Gathered payer analytics requirements through JIRA and Confluence to define reporting outcome ${i + 1} for Claims Processing teams.`,
      ),
      environments: ["Facets 6.x", "QNXT 5.x", "SQL Server 2019", "JIRA Cloud"],
      dates: { start: "Feb 2024", end: "Present" },
    },
  ],
  themeId: "classic_navy",
};

describe("assembleDocx", () => {
  it("produces a non-empty docx buffer", async () => {
    const buffer = await assembleDocx(mockResume);
    expect(buffer.length).toBeGreaterThan(1000);
    expect(buffer.subarray(0, 2).toString()).toBe("PK");
  });

  it("builds a safe filename", () => {
    expect(resumeFilename("Mamatha K.")).toBe("Mamatha_K.docx");
  });
});

describe("themes", () => {
  it("renders all eight themes", async () => {
    const themes = [
      "classic_navy",
      "modern_sage",
      "minimal_mono",
      "executive_burgundy",
      "tech_slate",
      "compact_pro",
      "banded_indigo",
      "elegant_garamond",
    ];
    for (const themeId of themes) {
      const buffer = await assembleDocx({ ...mockResume, themeId });
      expect(buffer.length).toBeGreaterThan(1000);
    }
  });
});
