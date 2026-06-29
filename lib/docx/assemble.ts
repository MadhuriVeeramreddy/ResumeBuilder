import {
  AlignmentType,
  BorderStyle,
  Document,
  LevelFormat,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
  convertInchesToTwip,
} from "docx";
import { formatContactLine, resolveContact } from "../contact";
import type { ResumeModel } from "../schemas";
import type { ExperienceLayout, ResumeTemplate, SectionKind } from "../themes/types";
import { getTheme } from "../themes/registry";

const BULLET_REF = "resume-bullets";
const BODY_LEFT_STYLE = "ResumeBodyLeft";

function ptHalf(pt: number): number {
  return Math.round(pt * 2);
}

function ptTwip(pt: number): number {
  return Math.round(pt * 20);
}

function hex(color: string): string {
  return color.replace("#", "").toUpperCase();
}

function lineSpacing(template: ResumeTemplate) {
  return Math.round(template.lineSpacing * 20);
}

function spacing(template: ResumeTemplate, extra?: { before?: number; after?: number }) {
  return {
    before: ptTwip(extra?.before ?? 0),
    after: ptTwip(extra?.after ?? 0),
    line: lineSpacing(template),
  };
}

function run(
  text: string,
  template: ResumeTemplate,
  opts?: { bold?: boolean; italics?: boolean; color?: string; size?: number; font?: string; underline?: boolean },
): TextRun {
  return new TextRun({
    text,
    font: opts?.font ?? template.fonts.body,
    size: ptHalf(opts?.size ?? template.sizes.body),
    color: hex(opts?.color ?? template.colors.body),
    bold: opts?.bold,
    italics: opts?.italics,
    underline: opts?.underline ? {} : undefined,
  });
}

function emptyLine(template: ResumeTemplate): Paragraph {
  return new Paragraph({
    style: BODY_LEFT_STYLE,
    spacing: spacing(template),
    children: [],
  });
}

/** Kishan-style bold decorative rule (thinThickSmallGap). */
function kishanDecorativeRule(template: ResumeTemplate): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: spacing(template),
    border: {
      bottom: { style: BorderStyle.THICK_THIN_SMALL_GAP, size: 24, color: "auto", space: 1 },
    },
    children: [],
  });
}

/** Gray band section heading with padded shaded bar. */
function kishanBandHeading(template: ResumeTemplate, label: string): Paragraph {
  return new Paragraph({
    style: BODY_LEFT_STYLE,
    alignment: AlignmentType.CENTER,
    shading: { fill: hex(template.colors.sectionShading), type: ShadingType.CLEAR, color: "auto" },
    spacing: {
      before: ptTwip(8),
      after: ptTwip(8),
      line: ptTwip(16),
    },
    children: [run(label, template, { bold: true, underline: true, font: template.fonts.heading })],
  });
}

function isKishanTemplate(template: ResumeTemplate): boolean {
  return template.sectionHeading === "kishan_band";
}

function kishanSectionLeadingGap(template: ResumeTemplate): Paragraph[] {
  return isKishanTemplate(template) ? [emptyLine(template)] : [];
}

function paragraph(
  children: TextRun[],
  template: ResumeTemplate,
  opts?: { align?: (typeof AlignmentType)[keyof typeof AlignmentType]; before?: number; after?: number; border?: boolean; shading?: string },
): Paragraph {
  return new Paragraph({
    style: BODY_LEFT_STYLE,
    alignment: opts?.align ?? AlignmentType.LEFT,
    spacing: spacing(template, { before: opts?.before, after: opts?.after }),
    border: opts?.border
      ? { bottom: { style: BorderStyle.SINGLE, size: 6, color: hex(template.colors.rule), space: 1 } }
      : undefined,
    shading: opts?.shading
      ? { fill: hex(opts.shading), type: ShadingType.CLEAR, color: "auto" }
      : undefined,
    children,
  });
}

function bullet(
  text: string,
  template: ResumeTemplate,
  align: (typeof AlignmentType)[keyof typeof AlignmentType] = AlignmentType.LEFT,
): Paragraph {
  return new Paragraph({
    style: BODY_LEFT_STYLE,
    alignment: align,
    spacing: spacing(template),
    numbering: { reference: BULLET_REF, level: 0 },
    children: [run(text, template)],
  });
}

function formatDuration(template: ResumeTemplate, start: string, end: string): string {
  if (template.experience === "akhil_java") {
    return `${start} to ${end}`;
  }
  if (template.experience === "akhil_data") {
    return `${start.toUpperCase()} – ${end === "Present" ? "Present" : end.toUpperCase()}`;
  }
  if (template.experience === "jayanth") {
    return `${start} - ${end === "Present" ? "present" : end}`;
  }
  return `${start} – ${end}`;
}

const NO_CELL_BORDERS = {
  top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
};

const TABLE_BORDERS = {
  top: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
  bottom: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
  left: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
  right: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
  insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
  insideVertical: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
};

function twoColumnLine(
  left: TextRun[],
  right: TextRun[],
  template: ResumeTemplate,
): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: NO_CELL_BORDERS,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 70, type: WidthType.PERCENTAGE },
            borders: NO_CELL_BORDERS,
            children: [paragraph(left, template)],
          }),
          new TableCell({
            width: { size: 30, type: WidthType.PERCENTAGE },
            borders: NO_CELL_BORDERS,
            children: [paragraph(right, template, { align: AlignmentType.RIGHT })],
          }),
        ],
      }),
    ],
  });
}

function sectionHeading(template: ResumeTemplate, kind: SectionKind): Paragraph {
  const label = template.sectionLabels[kind] ?? kind.toUpperCase();
  const color = template.colors.heading;

  switch (template.sectionHeading) {
    case "kishan_band":
      return kishanBandHeading(template, label);
    case "purple_underline":
      return paragraph([run(label, template, { bold: true, underline: true, color, size: template.sizes.sectionHeading })], template, {
        before: kind === "skills" ? 3.9 : 0,
      });
    case "blue_rule":
      return paragraph(
        [run(label, template, { bold: true, color, size: template.sizes.sectionHeading })],
        template,
        { align: AlignmentType.BOTH, border: true },
      );
    case "arial_bold":
      return paragraph([run(label, template, { bold: true, font: template.fonts.heading })], template, {
        align: AlignmentType.BOTH,
      });
  }

  return paragraph([run(label, template, { bold: true })], template);
}

function buildHeader(resume: ResumeModel, template: ResumeTemplate): (Paragraph | Table)[] {
  const contact = formatContactLine(resolveContact(resume.contact));

  switch (template.header) {
    case "kishan":
      return [
        paragraph([run(resume.name, template, { bold: true, size: template.sizes.name })], template, {
          align: AlignmentType.CENTER,
          after: 7,
        }),
        paragraph([run(`${contact} `, template, { bold: true, size: template.sizes.contact })], template, {
          align: AlignmentType.CENTER,
        }),
        kishanDecorativeRule(template),
      ];

    case "akhil_data":
      return [
        paragraph([run(resume.name.toUpperCase(), template, { color: template.colors.name, size: template.sizes.name })], template),
        paragraph([run(`• ${contact.replace(/ · /g, " • ")}`, template)], template),
        emptyLine(template),
        paragraph([run(resume.title, template, { size: template.sizes.role })], template),
        emptyLine(template),
      ];

    case "akhil_java":
      return [
        paragraph([run(resume.name, template, { size: template.sizes.name })], template, { after: 1, before: 0.25 }),
        paragraph([run(contact, template, { size: template.sizes.contact })], template, { before: 1.05 }),
        emptyLine(template),
      ];

    case "vasu":
      return [
        paragraph([run(resume.name, template, { bold: true, color: template.colors.name, size: template.sizes.name })], template, {
          align: AlignmentType.CENTER,
        }),
        paragraph([run(resume.title, template, { bold: true, color: template.colors.role, size: template.sizes.role })], template, {
          align: AlignmentType.CENTER,
        }),
        paragraph([run(contact, template, { color: template.colors.contact, size: template.sizes.contact })], template, {
          align: AlignmentType.CENTER,
        }),
      ];

    case "jayanth":
      return [
        paragraph([run(resume.name, template, { bold: true, size: template.sizes.name, font: template.fonts.heading })], template, {
          align: AlignmentType.BOTH,
        }),
        paragraph(
          [run(resume.title, template, { bold: true, color: template.colors.role, size: template.sizes.role, font: template.fonts.heading })],
          template,
          { align: AlignmentType.BOTH },
        ),
        emptyLine(template),
        paragraph(
          [
            run("Email: ", template, { bold: true, size: template.sizes.contact, font: template.fonts.heading }),
            run(contact, template, { size: template.sizes.contact, font: template.fonts.heading }),
          ],
          template,
          { align: AlignmentType.BOTH, border: true },
        ),
        emptyLine(template),
      ];

    case "keerthana_table":
      return [
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: NO_CELL_BORDERS,
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  borders: NO_CELL_BORDERS,
                  children: [paragraph([run(resume.name, template, { size: template.sizes.name })], template)],
                }),
                new TableCell({
                  borders: NO_CELL_BORDERS,
                  children: [paragraph([run(resume.title, template, { size: template.sizes.role })], template)],
                }),
                new TableCell({
                  borders: NO_CELL_BORDERS,
                  children: [paragraph([run(contact, template, { size: template.sizes.contact })], template)],
                }),
              ],
            }),
          ],
        }),
      ];
  }
}

function summaryAlign(template: ResumeTemplate): (typeof AlignmentType)[keyof typeof AlignmentType] {
  if (template.header === "kishan") return AlignmentType.BOTH;
  if (template.header === "akhil_data" || template.header === "keerthana_table") return AlignmentType.BOTH;
  return AlignmentType.BOTH;
}

function buildSummary(resume: ResumeModel, template: ResumeTemplate, bulletsOnly = false): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  const align = summaryAlign(template);

  if (!bulletsOnly) {
    out.push(
      paragraph([run(resume.summary.opening, template)], template, { align }),
    );
  }

  for (const item of resume.summary.bullets) {
    out.push(bullet(item, template, align));
  }

  return out;
}

function buildSkills(resume: ResumeModel, template: ResumeTemplate): (Paragraph | Table)[] {
  if (template.skills === "table_bordered") {
    return [
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: TABLE_BORDERS,
        rows: resume.skills.map(
          (group) =>
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 28, type: WidthType.PERCENTAGE },
                  children: [paragraph([run(group.label, template, { bold: true })], template)],
                }),
                new TableCell({
                  width: { size: 72, type: WidthType.PERCENTAGE },
                  children: [paragraph([run(group.items.join(", "), template)], template)],
                }),
              ],
            }),
        ),
      }),
    ];
  }

  const align = template.header === "kishan" ? AlignmentType.BOTH : AlignmentType.LEFT;
  return resume.skills.map((group) =>
    paragraph(
      [run(`${group.label}: `, template, { bold: true }), run(group.items.join(", "), template)],
      template,
      { align },
    ),
  );
}

function buildEducation(resume: ResumeModel, template: ResumeTemplate): Paragraph[] {
  const lines = resume.education?.length ? resume.education : template.educationDefault;
  return lines.map((line) => paragraph([run(line, template, { bold: template.sectionHeading === "plain" && template.id === "akhil_data_engineer" })], template));
}

function buildCertifications(template: ResumeTemplate): Paragraph[] {
  if (!template.certifications?.length) return [];
  return template.certifications.map((line) =>
    paragraph([run(line, template, { bold: template.id === "keerthana_servicenow" })], template),
  );
}

function buildExperienceBlock(resume: ResumeModel, template: ResumeTemplate): (Paragraph | Table)[] {
  const blocks: (Paragraph | Table)[] = [];

  for (let roleIndex = 0; roleIndex < resume.roles.length; roleIndex++) {
    const role = resume.roles[roleIndex];
    if (!isKishanTemplate(template) || roleIndex > 0) {
      blocks.push(emptyLine(template));
    }
    const duration = formatDuration(template, role.dates.start, role.dates.end);

    switch (template.experience as ExperienceLayout) {
      case "kishan":
        blocks.push(
          paragraph(
            [
              run(`${role.title} | `, template, { bold: true, font: template.fonts.body }),
              run(duration, template, { bold: true, font: template.fonts.body }),
            ],
            template,
          ),
        );
        blocks.push(
          paragraph([run(`${role.company}, ${role.location}`, template, { bold: true, font: template.fonts.body })], template),
        );
        blocks.push(emptyLine(template));
        break;

      case "akhil_data":
        blocks.push(paragraph([run(duration, template, { bold: true, color: template.colors.duration })], template));
        blocks.push(
          paragraph(
            [
              run(`${role.title} | `, template, { size: 11 }),
              run(`${role.company} | ${role.location}`, template),
            ],
            template,
          ),
        );
        break;

      case "akhil_java":
        blocks.push(
          paragraph(
            [run(`${role.company}, ${role.location} ${duration}`, template, { bold: true, color: template.colors.duration, size: template.sizes.body })],
            template,
          ),
        );
        blocks.push(paragraph([run(role.title, template, { bold: true, color: template.colors.duration, size: template.sizes.body })], template));
        blocks.push(emptyLine(template));
        blocks.push(paragraph([run("Responsibilities:", template, { bold: true, size: template.sizes.body })], template));
        break;

      case "vasu":
        blocks.push(
          twoColumnLine(
            [
              run(`${role.title} `, template, { bold: true, color: template.colors.duration }),
            ],
            [
              run(duration, template, { bold: true, color: template.colors.duration }),
            ],
            template,
          ),
        );
        blocks.push(
          paragraph(
            [run(`${role.company} | ${role.location}`, template, { bold: true, color: template.colors.duration })],
            template,
          ),
        );
        break;

      case "jayanth":
        blocks.push(
          paragraph(
            [
              run("Client: ", template, { bold: true, size: template.sizes.body, font: template.fonts.heading }),
              run(`${role.company} (${role.location})`, template, { bold: true, size: template.sizes.body, font: template.fonts.heading }),
            ],
            template,
          ),
        );
        blocks.push(
          paragraph(
            [
              run("Role: ", template, { bold: true, size: template.sizes.body, font: template.fonts.heading }),
              run(`${role.title} ${duration}`, template, { bold: true, size: template.sizes.body, font: template.fonts.heading }),
            ],
            template,
          ),
        );
        blocks.push(emptyLine(template));
        break;

      case "keerthana":
        blocks.push(
          twoColumnLine(
            [run(role.company.toUpperCase(), template, { size: 11 })],
            [run(duration.toUpperCase(), template, { size: 11 })],
            template,
          ),
        );
        blocks.push(paragraph([run(`${role.title} — ${role.location}`, template, { bold: true })], template));
        break;
    }

    blocks.push(
      paragraph(
        [
          run(`${role.projectName}: `, template, { bold: true }),
          run(role.intro, template),
        ],
        template,
        { align: AlignmentType.BOTH },
      ),
    );

    for (const item of role.bullets) {
      blocks.push(bullet(item, template, AlignmentType.BOTH));
    }

    if (template.experience !== "akhil_java") {
      blocks.push(
        paragraph(
          [run("Environments: ", template, { bold: true }), run(role.environments.join(", "), template)],
          template,
          { align: AlignmentType.BOTH },
        ),
      );
    }

    blocks.push(emptyLine(template));
  }

  return blocks;
}

function buildSection(
  kind: SectionKind,
  resume: ResumeModel,
  template: ResumeTemplate,
): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];

  if (kind === "profile") {
    const label = template.sectionLabels.profile ?? "PROFILE";
    if (template.sectionHeading === "kishan_band") {
      out.push(emptyLine(template));
      out.push(kishanBandHeading(template, label));
      out.push(...kishanSectionLeadingGap(template));
      out.push(
        paragraph([run(resume.summary.opening, template, { font: template.fonts.body })], template, {
          align: AlignmentType.CENTER,
        }),
      );
      out.push(kishanDecorativeRule(template));
      out.push(emptyLine(template));
      return out;
    }

    out.push(sectionHeading(template, "profile"));
    out.push(
      paragraph([run(resume.summary.opening, template, { font: template.fonts.body })], template, {
        align: AlignmentType.CENTER,
      }),
    );
    out.push(emptyLine(template));
    return out;
  }

  if (kind === "summary") {
    if (template.summaryHeading) {
      out.push(sectionHeading(template, "summary"));
    }
    out.push(...kishanSectionLeadingGap(template));
    out.push(...buildSummary(resume, template, template.splitProfileSummary));
    out.push(emptyLine(template));
    return out;
  }

  if (kind === "skills") {
    out.push(sectionHeading(template, "skills"));
    out.push(...kishanSectionLeadingGap(template));
    out.push(...buildSkills(resume, template));
    out.push(emptyLine(template));
    return out;
  }

  if (kind === "education") {
    out.push(sectionHeading(template, "education"));
    out.push(...kishanSectionLeadingGap(template));
    out.push(...buildEducation(resume, template));
    out.push(emptyLine(template));
    return out;
  }

  if (kind === "certifications") {
    out.push(sectionHeading(template, "certifications"));
    out.push(...kishanSectionLeadingGap(template));
    out.push(...buildCertifications(template));
    out.push(emptyLine(template));
    return out;
  }

  out.push(sectionHeading(template, "experience"));
  out.push(...kishanSectionLeadingGap(template));
  out.push(...buildExperienceBlock(resume, template));
  return out;
}

export async function assembleDocx(resume: ResumeModel, themeId?: string): Promise<Buffer> {
  const template = getTheme(themeId ?? resume.themeId);
  const children: (Paragraph | Table)[] = [];

  children.push(...buildHeader(resume, template));

  if (template.header !== "kishan" && template.header !== "jayanth") {
    children.push(emptyLine(template));
  }

  for (const section of template.sectionOrder) {
    children.push(...buildSection(section, resume, template));
  }

  const doc = new Document({
    styles: {
      paragraphStyles: [
        {
          id: BODY_LEFT_STYLE,
          name: "Resume Body Left",
          basedOn: "Normal",
          quickFormat: true,
          paragraph: { alignment: AlignmentType.LEFT },
        },
      ],
    },
    numbering: {
      config: [
        {
          reference: BULLET_REF,
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: template.bulletGlyph,
              alignment: AlignmentType.LEFT,
              style: {
                paragraph: {
                  indent: { left: convertInchesToTwip(0.25), hanging: convertInchesToTwip(0.18) },
                },
              },
            },
          ],
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(template.margins.top),
              bottom: convertInchesToTwip(template.margins.bottom),
              left: convertInchesToTwip(template.margins.left),
              right: convertInchesToTwip(template.margins.right),
            },
          },
        },
        children,
      },
    ],
  });

  return Packer.toBuffer(doc);
}

export function resumeFilename(name: string): string {
  const safe = name.trim().replace(/[^\w\s-]/g, "").replace(/\s+/g, "_");
  return `${safe || "resume"}.docx`;
}
