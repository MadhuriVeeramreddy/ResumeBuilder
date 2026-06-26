import type { GenerationInput } from "../schemas";
import { getDomainKeys, inferDomainFromCompany, isIndiaCompany, kbSummaryForPrompt } from "../kb";

const US_CITIES = [
  "New York, NY",
  "Jersey City, NJ",
  "Chicago, IL",
  "Dallas, TX",
  "Atlanta, GA",
  "Cincinnati, OH",
  "Charlotte, NC",
  "Seattle, WA",
  "Boston, MA",
  "Phoenix, AZ",
];

const INDIA_CITIES = [
  "Hyderabad, India",
  "Bangalore, India",
  "Pune, India",
  "Chennai, India",
  "Mumbai, India",
];

export function buildPlanPrompt(input: GenerationInput): string {
  const kb = kbSummaryForPrompt();
  const domainKeys = getDomainKeys();

  const companies = input.companies.map((c, i) => ({
    index: i + 1,
    name: c.name,
    country: c.country,
    suggestedDomain: inferDomainFromCompany(c.name, input.role),
    isIndia: isIndiaCompany(c.country, c.name),
  }));

  return `You are a resume planning assistant. Return ONLY valid JSON matching this shape:
{
  "roles": [{
    "company": string,
    "location": string,
    "domainKey": string,
    "title": string,
    "specialization": string
  }]
}

Rules:
- Candidate role: ${input.role}
- Return exactly ${companies.length} roles, one per input company, same order (most recent first).
- Companies are listed most-recent-first; the LAST company should be the India/offshore role when applicable.
- Use domainKey from this allowed list ONLY: ${JSON.stringify(domainKeys)}
- Each role needs a plausible US or India city location.
- Titles should match seniority (most recent = Senior, oldest India = Junior when 10+ years).
- specialization is a short project/theme label (2-4 words).
- Do NOT include skillCategories — skills are derived separately from the knowledge base.
- Titles should match seniority (most recent = Senior, oldest India = Junior when 10+ years).
- specialization is a short project/theme label (2-4 words).
- Do NOT invent tools outside the knowledge base domains.

Knowledge base excerpt:
${kb}

Input companies:
${JSON.stringify(companies, null, 2)}

Location hints: US cities like ${US_CITIES.slice(0, 4).join(", ")}; India cities like ${INDIA_CITIES.slice(0, 3).join(", ")}.`;
}

export function fallbackLocation(country: string, index: number, isIndia: boolean): string {
  if (isIndia || country.toLowerCase().includes("india")) {
    return INDIA_CITIES[index % INDIA_CITIES.length];
  }
  return US_CITIES[index % US_CITIES.length];
}
