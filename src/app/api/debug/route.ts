import { NextResponse } from "next/server";

export const runtime = 'edge';

// Dynamically import Cloudflare context only when available
async function getCloudflareEnv(): Promise<Record<string, unknown> | undefined> {
  try {
    // Only import if we're in a Cloudflare Pages environment
    if (process.env.CF_PAGES) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore - Dynamic import for Cloudflare Pages, may not be available in all environments
      const { getRequestContext } = await import("@cloudflare/next-on-pages");
      return getRequestContext?.().env as Record<string, unknown> | undefined;
    }
  } catch {
    // Silently fail if module not available
  }
  return undefined;
}

export async function GET() {
  const cfEnv = await getCloudflareEnv();

  // Check for API key in both locations
  const hasAdminKey = !!(cfEnv?.OPENAI_ADMIN_KEY ?? process.env.OPENAI_ADMIN_KEY);
  const apiKey = (cfEnv?.OPENAI_ADMIN_KEY ?? process.env.OPENAI_ADMIN_KEY) as string | undefined;

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    environment: {
      isCfPages: !!process.env.CF_PAGES,
      nodeEnv: process.env.NODE_ENV,
      hasCfEnv: !!cfEnv,
    },
    apiKey: {
      configured: hasAdminKey,
      source: cfEnv?.OPENAI_ADMIN_KEY ? 'Cloudflare KV' : process.env.OPENAI_ADMIN_KEY ? 'process.env' : 'none',
      prefix: apiKey ? apiKey.substring(0, 7) + '...' : 'missing',
      length: apiKey?.length || 0,
    },
    kvNamespace: {
      hasApiKeyMappings: !!(cfEnv?.API_KEY_MAPPINGS),
    },
    hint: !hasAdminKey
      ? "OPENAI_ADMIN_KEY is not configured. Go to Cloudflare Pages > Settings > Environment Variables and add OPENAI_ADMIN_KEY for Production environment."
      : "Configuration looks good!"
  });
}
