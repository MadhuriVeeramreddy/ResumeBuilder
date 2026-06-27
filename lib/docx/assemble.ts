import {
  AlignmentType,
  BorderStyle,
  Document,
  LevelFormat,
  Packer,
  Paragraph,
  ShadingType,
  TextRun,
  convertInchesToTwip,
} from "docx";
import { formatContactLine, resolveContact } from "../contact";
import type { ResumeModel } from "../schemas";
import { getTheme } from "../themes/registry";
import type { ResumeTheme } from "../themes/types";

const BULLET_REF = "resume-bullets";
const HEADER_CENTER_STYLE = "ResumeHeaderCenter";
const BODY_LEFT_STYLE = "ResumeBodyLeft";
const DEFAULT_EDUCATION = ["Bachelors in Computer Science,"];

function ptToHalfPoints(pt: number): number {
  return Math.round(pt * 2);
}

function ptToTwips(pt: number): number {
  return Math.round(pt * 20);
}

function hexToDocxColor(hex: string): string {
  return hex.replace("#", "").toUpperCase();
}

function applyCase(text: string, mode: "normal" | "upper" | "title"): string {
  if (mode === "upper") return text.toUpperCase();
  if (mode === "title") {
    return text.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
  }
  return text;
}

function paragraphSpacing(theme: ResumeTheme, extra?: { before?: number; after?: number }) {
  return {
    before: ptToTwips(extra?.before ?? 0),
    after: ptToTwips(extra?.after ?? theme.spacing.paraAfter),
    line: Math.round(theme.spacing.line * 240),
  };
}

function bodyRun(
  text: string,
  theme: ResumeTheme,
  opts?: { bold?: boolean; italics?: boolean; color?: string; size?: number },
) {
  return new TextRun({
    text,
    font: theme.fonts.body,
    size: ptToHalfPoints(opts?.size ?? theme.sizes.body),
    color: hexToDocxColor(opts?.color ?? theme.colors.body),
    bold: opts?.bold,
    italics: opts?.italics,
  });
}

function emptyLine(theme: ResumeTheme): Paragraph {
  return new Paragraph({
    style: BODY_LEFT_STYLE,
    alignment: AlignmentType.LEFT,
    spacing: { before: 0, after: 0, line: Math.round(theme.spacing.line * 240) },
    children: [],
  });
}

function sectionHeading(text: string, theme: ResumeTheme): Paragraph {
  const label = applyCase(text, theme.sectionHeadingCase);
  const border =
    theme.sectionRule === "none"
      ? undefined
      : {
          bottom: {
            color: hexToDocxColor(theme.colors.rule),
            space: 1,
            style: BorderStyle.SINGLE,
            size: theme.sectionRule === "short" ? 4 : 6,
          },
        };

  return new Paragraph({
    style: BODY_LEFT_STYLE,
    alignment: AlignmentType.LEFT,
    spacing: paragraphSpacing(theme, { before: theme.spacing.sectionBefore, after: 6 }),
    border,
    children: [
      new TextRun({
        text: label,
        font: theme.fonts.heading,
        size: ptToHalfPoints(theme.sizes.sectionHeading),
        bold: true,
        color: hexToDocxColor(theme.colors.heading),
      }),
    ],
  });
}

function bulletParagraph(text: string, theme: ResumeTheme): Paragraph {
  return new Paragraph({
    style: BODY_LEFT_STYLE,
    alignment: AlignmentType.LEFT,
    spacing: paragraphSpacing(theme),
    numbering: { reference: BULLET_REF, level: 0 },
    children: [bodyRun(text, theme)],
  });
}

function bodyParagraph(
  content: TextRun[],
  theme: ResumeTheme,
  opts?: { before?: number; after?: number; alignment?: (typeof AlignmentType)[keyof typeof AlignmentType] },
): Paragraph {
  return new Paragraph({
    style: BODY_LEFT_STYLE,
    alignment: opts?.alignment ?? AlignmentType.LEFT,
    spacing: paragraphSpacing(theme, { before: opts?.before, after: opts?.after }),
    children: content,
  });
}

function buildHeader(resume: ResumeModel, theme: ResumeTheme): Paragraph[] {
  const nameText = applyCase(resume.name, theme.nameCase);
  const contactLine = formatContactLine(resolveContact(resume.contact));
  // Name + contact are always centered per house style (overrides theme.nameAlign).
  const alignment = AlignmentType.CENTER;

  const bandShading = theme.nameBand
    ? { fill: hexToDocxColor(theme.colors.accent), type: ShadingType.CLEAR, color: "auto" }
    : undefined;

  const headerParagraph = (opts: {
    after?: number;
    border?: {
      bottom: { color: string; space: number; style: typeof BorderStyle.SINGLE; size: number };
    };
    children: TextRun[];
  }) =>
    new Paragraph({
      style: HEADER_CENTER_STYLE,
      alignment,
      spacing: paragraphSpacing(theme, { after: opts.after ?? 2 }),
      shading: bandShading,
      border: opts.border,
      children: opts.children,
    });

  return [
    headerParagraph({
      border:
        theme.nameRule === "full" && !theme.nameBand
          ? {
              bottom: {
                color: hexToDocxColor(theme.colors.rule),
                space: 1,
                style: BorderStyle.SINGLE,
                size: 6,
              },
            }
          : undefined,
      children: [
        new TextRun({
          text: nameText,
          font: theme.fonts.heading,
          size: ptToHalfPoints(theme.sizes.name),
          bold: true,
          color: hexToDocxColor(theme.nameBand ? "#FFFFFF" : theme.colors.name),
        }),
      ],
    }),
    headerParagraph({
      children: [
        new TextRun({
          text: resume.title,
          font: theme.fonts.body,
          size: ptToHalfPoints(theme.sizes.roleTitle),
          bold: true,
          color: hexToDocxColor(theme.nameBand ? "#FFFFFF" : theme.colors.body),
        }),
      ],
    }),
    headerParagraph({
      after: 8,
      children: [
        new TextRun({
          text: contactLine,
          font: theme.fonts.body,
          size: ptToHalfPoints(theme.sizes.small),
          color: hexToDocxColor(theme.nameBand ? "#FFFFFF" : theme.colors.body),
        }),
      ],
    }),
  ];
}

function bulletFormat(): (typeof LevelFormat)[keyof typeof LevelFormat] {
  return LevelFormat.BULLET;
}

export async function assembleDocx(resume: ResumeModel, themeId?: string): Promise<Buffer> {
  const theme = getTheme(themeId ?? resume.themeId);
  const children: Paragraph[] = [];
  const educationLines = resume.education?.length ? resume.education : DEFAULT_EDUCATION;

  children.push(...buildHeader(resume, theme));
  children.push(emptyLine(theme));

  children.push(sectionHeading("Summary", theme));
  children.push(bodyParagraph([bodyRun(resume.summary.opening, theme)], theme));
  for (const bullet of resume.summary.bullets) {
    children.push(bulletParagraph(bullet, theme));
  }
  children.push(emptyLine(theme));

  children.push(sectionHeading("Technical Skills", theme));
  for (const group of resume.skills) {
    children.push(
      bodyParagraph(
        [bodyRun(`${group.label}: `, theme, { bold: true }), bodyRun(group.items.join(", "), theme)],
        theme,
      ),
    );
  }
  children.push(emptyLine(theme));

  children.push(sectionHeading("Education", theme));
  for (const line of educationLines) {
    children.push(bodyParagraph([bodyRun(line, theme)], theme, { alignment: AlignmentType.LEFT }));
  }
  children.push(emptyLine(theme));

  children.push(sectionHeading("Professional Experience", theme));
  for (const role of resume.roles) {
    children.push(emptyLine(theme));

    children.push(
      bodyParagraph(
        [
          bodyRun(`${role.title} | `, theme, { bold: true }),
          bodyRun(`${role.dates.start} – ${role.dates.end}`, theme),
        ],
        theme,
        { alignment: AlignmentType.LEFT, before: 0 },
      ),
    );

    children.push(
      bodyParagraph([bodyRun(role.company, theme, { bold: true })], theme, {
        alignment: AlignmentType.LEFT,
        after: 4,
      }),
    );

    children.push(
      bodyParagraph([bodyRun(`${role.projectName}: ${role.intro}`, theme)], theme),
    );

    for (const bullet of role.bullets) {
      children.push(bulletParagraph(bullet, theme));
    }

    children.push(
      bodyParagraph(
        [bodyRun("Environments: ", theme, { bold: true }), bodyRun(role.environments.join(", "), theme)],
        theme,
        { after: 4 },
      ),
    );

    children.push(emptyLine(theme));
  }

  const doc = new Document({
    styles: {
      paragraphStyles: [
        {
          id: BODY_LEFT_STYLE,
          name: "Resume Body Left",
          basedOn: "Normal",
          quickFormat: true,
          paragraph: {
            alignment: AlignmentType.LEFT,
          },
        },
        {
          id: HEADER_CENTER_STYLE,
          name: "Resume Header Center",
          basedOn: "Normal",
          paragraph: {
            alignment: AlignmentType.CENTER,
          },
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
              format: bulletFormat(),
              text: theme.bulletGlyph,
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
              top: convertInchesToTwip(theme.margins.top),
              bottom: convertInchesToTwip(theme.margins.bottom),
              left: convertInchesToTwip(theme.margins.left),
              right: convertInchesToTwip(theme.margins.right),
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
