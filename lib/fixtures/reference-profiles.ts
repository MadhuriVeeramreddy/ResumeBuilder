import type { GenerationInput } from "../schemas";

export type ReferenceProfile = {
  id: string;
  label: string;
  input: GenerationInput;
};

export const REFERENCE_PROFILES: ReferenceProfile[] = [
  {
    id: "mamatha",
    label: "Mamatha (Business Analyst)",
    input: {
      name: "Mamatha",
      role: "Business Analyst",
      yearsExperience: 10,
      companies: [
        { name: "Cigna", country: "USA" },
        { name: "Assurant", country: "USA" },
        { name: "State of OH", country: "USA" },
        { name: "ICICI Bank", country: "India" },
      ],
      themeId: "classic_navy",
    },
  },
  {
    id: "bhargavi",
    label: "Bhargavi (Data Analyst)",
    input: {
      name: "Bhargavi",
      role: "Data Analyst",
      yearsExperience: 10,
      companies: [
        { name: "United Health Group", country: "USA" },
        { name: "Mazda Motor", country: "USA" },
        { name: "AIG Insurance", country: "USA" },
        { name: "TCS", country: "India" },
      ],
      themeId: "modern_sage",
    },
  },
  {
    id: "vasu",
    label: "Vasu (C++ Developer)",
    input: {
      name: "Vasu",
      role: "C++ Developer",
      yearsExperience: 10,
      companies: [
        { name: "Ford", country: "USA" },
        { name: "Goldman Sachs", country: "USA" },
        { name: "Medtronic", country: "USA" },
        { name: "KPIT", country: "India" },
      ],
      themeId: "tech_slate",
    },
  },
  {
    id: "sharan",
    label: "Sharan (C++ Developer)",
    input: {
      name: "Sharan",
      role: "C++ Developer",
      yearsExperience: 10,
      companies: [
        { name: "General Motors", country: "USA" },
        { name: "Verizon", country: "USA" },
        { name: "Baxter", country: "USA" },
        { name: "Infosys", country: "India" },
      ],
      themeId: "modern_sage",
    },
  },
];

export function getReferenceProfile(id: string): ReferenceProfile | undefined {
  return REFERENCE_PROFILES.find((p) => p.id === id);
}
