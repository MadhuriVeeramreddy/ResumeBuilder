export const runtime = "nodejs";
export const maxDuration = 300;

import { assembleDocx, resumeFilename } from "@/lib/docx/assemble";
import { isStageError } from "@/lib/errors";
import { generateResumeModel, type ProgressEvent } from "@/lib/orchestrator";
import { GenerationInputSchema } from "@/lib/schemas";

function sseEncode(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = GenerationInputSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(sseEncode(event, data)));
      };

      try {
        const resume = await generateResumeModel(parsed.data, {
          onProgress: (progress: ProgressEvent) => send("progress", progress),
        });

        send("progress", { stage: "assembling", status: "running" });
        const themeId = parsed.data.themeId ?? resume.themeId;
        const buffer = await assembleDocx(resume, themeId);
        send("progress", { stage: "assembling", status: "done" });

        const filename = resumeFilename(resume.name);
        send("complete", {
          resume,
          filename,
          docxBase64: buffer.toString("base64"),
          assembledThemeId: themeId,
        });
        send("progress", { stage: "ready", status: "done" });
      } catch (error) {
        if (isStageError(error)) {
          send("error", { stage: error.stage, message: error.message });
        } else {
          send("error", {
            stage: "planning",
            message: error instanceof Error ? error.message : "Generation failed",
          });
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
