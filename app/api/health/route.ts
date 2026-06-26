export const runtime = "nodejs";

import { getServerConfig } from "@/lib/config";

export async function GET() {
  const config = getServerConfig();
  return Response.json({
    ok: true,
    provider: config.provider,
    hasApiKey: config.hasApiKey,
    model: config.primaryModel,
    fallbacks: config.fallbacks,
  });
}
