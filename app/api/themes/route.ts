export const runtime = "nodejs";

import { listThemes } from "@/lib/themes/registry";

export async function GET() {
  const themes = listThemes().map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    accent: t.colors.accent,
    fonts: t.fonts,
  }));
  return Response.json({ themes });
}
