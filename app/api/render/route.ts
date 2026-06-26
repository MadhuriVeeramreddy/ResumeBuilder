export const runtime = "nodejs";

import { assembleDocx, resumeFilename } from "@/lib/docx/assemble";
import { RenderRequestSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = RenderRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const themeId = parsed.data.themeId ?? parsed.data.resume.themeId;
  const buffer = await assembleDocx(parsed.data.resume, themeId);
  const filename = resumeFilename(parsed.data.resume.name);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
