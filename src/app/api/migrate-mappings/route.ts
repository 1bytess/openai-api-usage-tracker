import { NextResponse } from "next/server";
import apiKeyMappings from '@/lib/apiKeyMappings.json';

export const runtime = 'edge';

// Dynamically import Cloudflare context only when available
async function getCloudflareEnv(): Promise<{ API_KEY_MAPPINGS?: KVNamespace } | undefined> {
  try {
    // Only import if we're in a Cloudflare Pages environment
    if (process.env.CF_PAGES) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore - Dynamic import for Cloudflare Pages, may not be available in all environments
      const { getRequestContext } = await import("@cloudflare/next-on-pages");
      return getRequestContext?.().env as { API_KEY_MAPPINGS?: KVNamespace } | undefined;
    }
  } catch {
    // Silently fail if module not available
  }
  return undefined;
}

/**
 * Migration endpoint to copy API key mappings from JSON file to Cloudflare KV
 *
 * GET /api/migrate-mappings
 *
 * This is a one-time operation to migrate existing mappings.
 * After migration, you can manage mappings via the UI or API.
 */
export async function GET() {
  try {
    const cfEnv = await getCloudflareEnv();
    const kv = cfEnv?.API_KEY_MAPPINGS;

    if (!kv) {
      return NextResponse.json(
        {
          error: "KV namespace not configured. This endpoint only works in production.",
          note: "In local development, mappings are read directly from the JSON file."
        },
        { status: 500 }
      );
    }

    // Get current mappings from KV (if any)
    const existingMappingsJson = await kv.get("mappings");
    const existingMappings = existingMappingsJson ? JSON.parse(existingMappingsJson) : {};

    // Merge with JSON mappings (JSON mappings take precedence if they don't exist in KV)
    const mergedMappings = { ...apiKeyMappings, ...existingMappings };

    // Save merged mappings back to KV
    await kv.put("mappings", JSON.stringify(mergedMappings));

    return NextResponse.json({
      success: true,
      message: "Migration completed successfully",
      migratedCount: Object.keys(apiKeyMappings).length,
      totalMappings: Object.keys(mergedMappings).length,
      mappings: mergedMappings,
      details: {
        fromJson: Object.keys(apiKeyMappings).length,
        existingInKv: Object.keys(existingMappings).length,
        afterMerge: Object.keys(mergedMappings).length
      }
    });
  } catch (error) {
    console.error("Migration error:", error);
    return NextResponse.json(
      {
        error: "Migration failed",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
