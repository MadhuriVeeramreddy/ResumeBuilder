export type SectionKind =
  | "profile"
  | "summary"
  | "skills"
  | "education"
  | "certifications"
  | "experience";

export type HeaderLayout =
  | "kishan"
  | "akhil_data"
  | "akhil_java"
  | "vasu"
  | "jayanth"
  | "keerthana_table";

export type SectionHeadingLayout =
  | "kishan_band"
  | "plain"
  | "purple_underline"
  | "blue_rule"
  | "arial_bold";

export type SkillsLayout = "paragraph" | "table_bordered";

export type ExperienceLayout =
  | "kishan"
  | "akhil_data"
  | "akhil_java"
  | "vasu"
  | "jayanth"
  | "keerthana";

export type ResumeTemplate = {
  id: string;
  name: string;
  description: string;
  sectionOrder: SectionKind[];
  sectionLabels: Partial<Record<SectionKind, string>>;
  /** When false, summary content renders without a section heading (Akhil Data Engineer). */
  summaryHeading: boolean;
  /** Kishan: profile section uses opening only; summary section uses bullets only. */
  splitProfileSummary: boolean;
  header: HeaderLayout;
  sectionHeading: SectionHeadingLayout;
  skills: SkillsLayout;
  experience: ExperienceLayout;
  certifications?: string[];
  educationDefault: string[];
  fonts: { heading: string; body: string };
  colors: {
    name: string;
    role: string;
    contact: string;
    heading: string;
    body: string;
    accent: string;
    duration: string;
    rule: string;
    sectionShading: string;
  };
  sizes: {
    name: number;
    role: number;
    contact: number;
    sectionHeading: number;
    body: number;
  };
  margins: { top: number; bottom: number; left: number; right: number };
  lineSpacing: number;
  bulletGlyph: string;
};

/** @deprecated Use ResumeTemplate — kept for API compatibility */
export type ResumeTheme = ResumeTemplate;
