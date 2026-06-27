import { describe, expect, it } from "vitest";
import { computeTimeline, resolveTimeline } from "@/lib/timeline";
import type { Company } from "@/lib/schemas";

const NOW = new Date("2026-06-01T00:00:00Z");

describe("computeTimeline", () => {
  it("splits 10 years across 4 companies with Present on most recent", () => {
    const ranges = computeTimeline(10, 4, NOW);
    expect(ranges).toHaveLength(4);
    expect(ranges[0].end).toBe("Present");
    expect(ranges[3].end).not.toBe("Present");
  });

  it("handles 9 years", () => {
    const ranges = computeTimeline(9, 4, NOW);
    expect(ranges).toHaveLength(4);
    expect(ranges[0].start).toMatch(/^[A-Z][a-z]{2} \d{4}$/);
  });

  it("handles 3 companies", () => {
    const ranges = computeTimeline(10, 3, NOW);
    expect(ranges).toHaveLength(3);
  });

  it("handles 5 companies", () => {
    const ranges = computeTimeline(12, 5, NOW);
    expect(ranges).toHaveLength(5);
  });
});

describe("resolveTimeline", () => {
  it("uses explicit years when all companies provide startYear", () => {
    const companies: Company[] = [
      { name: "Truist", country: "USA", startYear: 2024, endYear: "present" },
      { name: "AstraZeneca", country: "USA", startYear: 2022, endYear: 2024 },
      { name: "Target", country: "USA", startYear: 2019, endYear: 2022 },
      { name: "Synechron INC", country: "India", startYear: 2018, endYear: 2019 },
    ];

    const ranges = resolveTimeline(companies, 8, NOW);
    expect(ranges).toEqual([
      { start: "Jan 2024", end: "Present" },
      { start: "Jan 2022", end: "Dec 2024" },
      { start: "Jan 2019", end: "Dec 2022" },
      { start: "Jan 2018", end: "Dec 2019" },
    ]);
  });

  it("falls back to computed timeline when start years are missing", () => {
    const companies: Company[] = [
      { name: "Cigna", country: "USA" },
      { name: "Assurant", country: "USA" },
      { name: "State of OH", country: "USA" },
      { name: "ICICI Bank", country: "India" },
    ];

    const ranges = resolveTimeline(companies, 10, NOW);
    expect(ranges).toHaveLength(4);
    expect(ranges[0].end).toBe("Present");
  });
});
