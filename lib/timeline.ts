import type { DateRange } from "./schemas";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const DEFAULT_WEIGHTS: Record<number, number[]> = {
  3: [0.38, 0.34, 0.28],
  4: [0.32, 0.28, 0.22, 0.18],
  5: [0.28, 0.24, 0.2, 0.16, 0.12],
};

function formatMonthYear(date: Date): string {
  return `${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function subtractOneMonth(date: Date): Date {
  return addMonths(date, -1);
}

export function computeTimeline(
  yearsExperience: number,
  companyCount: number,
  now: Date = new Date(),
): DateRange[] {
  if (companyCount < 3 || companyCount > 5) {
    throw new Error("companyCount must be between 3 and 5");
  }

  const weights = DEFAULT_WEIGHTS[companyCount];
  const totalMonths = Math.max(12, Math.round(yearsExperience * 12));
  const allocated = weights.map((w) => Math.max(6, Math.round(totalMonths * w)));
  const drift = totalMonths - allocated.reduce((a, b) => a + b, 0);
  allocated[allocated.length - 1] += drift;

  while (allocated[allocated.length - 1] < 6 && allocated[0] > 6) {
    allocated[0] -= 1;
    allocated[allocated.length - 1] += 1;
  }

  const ranges: DateRange[] = [];
  let end = new Date(now.getFullYear(), now.getMonth(), 1);

  for (let i = 0; i < companyCount; i++) {
    const months = allocated[i];
    const start = addMonths(end, -(months - 1));
    ranges.push({
      start: formatMonthYear(start),
      end: i === 0 ? "Present" : formatMonthYear(end),
    });
    end = subtractOneMonth(start);
  }

  return ranges;
}
