export type ResumeTheme = {
  id: string;
  name: string;
  description: string;
  fonts: { heading: string; body: string };
  sizes: {
    name: number;
    sectionHeading: number;
    roleTitle: number;
    body: number;
    small: number;
  };
  colors: {
    name: string;
    accent: string;
    heading: string;
    body: string;
    rule: string;
    link: string;
  };
  nameAlign: "left" | "center";
  nameCase: "normal" | "upper";
  sectionHeadingCase: "upper" | "title";
  sectionRule: "full" | "short" | "none";
  nameRule: "full" | "none";
  nameBand: boolean;
  bulletGlyph: "•" | "–" | "▪" | "◦" | "»";
  spacing: { line: number; paraAfter: number; sectionBefore: number };
  margins: { top: number; bottom: number; left: number; right: number };
};

export type ThemeDefinition = Omit<ResumeTheme, "id" | "name" | "description"> & {
  id: string;
  name: string;
  description: string;
};
