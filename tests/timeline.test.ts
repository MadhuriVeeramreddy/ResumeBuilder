import { describe, expect, it } from "vitest";
import { computeTimeline } from "@/lib/timeline";

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
