export const runtime = 'edge';

import { getRequestContext } from "@cloudflare/next-on-pages";

export const runtime = 'edge';

export async function GET(request: Request) {
  const host = new URL(request.url).host;
  const ctx = getRequestContext?.();
  const env = (ctx?.env ?? undefined) as Record<string, string> | undefined;
  const hasAdminKey = !!(env?.OPENAI_ADMIN_KEY ?? process.env.OPENAI_ADMIN_KEY);

  return Response.json(
    {
      status: "healthy",
      host,
      runtime: 'edge',
      hasRequestContext: !!ctx,
      hasEnv: !!env,
      hasAdminKey,
    },
    { status: 200 }
  );
}
