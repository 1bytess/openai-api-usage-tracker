import { NextResponse } from "next/server";

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

// GET: Retrieve all API key mappings
export async function GET() {
  try {
    const cfEnv = await getCloudflareEnv();
    const kv = cfEnv?.API_KEY_MAPPINGS;

    if (!kv) {
      // In local development, return the static mappings from JSON
      if (!process.env.CF_PAGES) {
        const apiKeyMappings = await import('@/lib/apiKeyMappings.json');
        return NextResponse.json(apiKeyMappings.default);
      }
      return NextResponse.json(
        { error: "KV namespace not configured" },
        { status: 500 }
      );
    }

    // Get all mappings from KV
    const mappingsJson = await kv.get("mappings");
    const mappings = mappingsJson ? JSON.parse(mappingsJson) : {};

    return NextResponse.json(mappings);
  } catch (error) {
    console.error("Error fetching mappings:", error);
    return NextResponse.json(
      { error: "Failed to fetch mappings", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// POST: Add or update an API key mapping
export async function POST(request: Request) {
  try {
    const body = await request.json() as { apiKeyId?: string; userName?: string };
    const { apiKeyId, userName } = body;

    // Validate input
    if (!apiKeyId || !userName) {
      return NextResponse.json(
        { error: "apiKeyId and userName are required" },
        { status: 400 }
      );
    }

    // Validate apiKeyId format (starts with "key_")
    if (!apiKeyId.startsWith("key_")) {
      return NextResponse.json(
        { error: "apiKeyId must start with 'key_'" },
        { status: 400 }
      );
    }

    const cfEnv = await getCloudflareEnv();
    const kv = cfEnv?.API_KEY_MAPPINGS;

    if (!kv) {
      return NextResponse.json(
        { error: "KV namespace not configured. This feature only works in production." },
        { status: 500 }
      );
    }

    // Get current mappings
    const mappingsJson = await kv.get("mappings");
    const mappings = mappingsJson ? JSON.parse(mappingsJson) : {};

    // Add or update the mapping
    mappings[apiKeyId] = userName;

    // Save back to KV
    await kv.put("mappings", JSON.stringify(mappings));

    return NextResponse.json({
      success: true,
      message: `Mapping added: ${apiKeyId} -> ${userName}`,
      mappings
    });
  } catch (error) {
    console.error("Error adding mapping:", error);
    return NextResponse.json(
      { error: "Failed to add mapping", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// DELETE: Remove an API key mapping
export async function DELETE(request: Request) {
  try {
    const body = await request.json() as { apiKeyId?: string };
    const { apiKeyId } = body;

    if (!apiKeyId) {
      return NextResponse.json(
        { error: "apiKeyId is required" },
        { status: 400 }
      );
    }

    const cfEnv = await getCloudflareEnv();
    const kv = cfEnv?.API_KEY_MAPPINGS;

    if (!kv) {
      return NextResponse.json(
        { error: "KV namespace not configured" },
        { status: 500 }
      );
    }

    // Get current mappings
    const mappingsJson = await kv.get("mappings");
    const mappings = mappingsJson ? JSON.parse(mappingsJson) : {};

    // Remove the mapping
    if (mappings[apiKeyId]) {
      delete mappings[apiKeyId];
      await kv.put("mappings", JSON.stringify(mappings));
      return NextResponse.json({ success: true, message: `Mapping removed: ${apiKeyId}` });
    } else {
      return NextResponse.json(
        { error: "Mapping not found" },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("Error deleting mapping:", error);
    return NextResponse.json(
      { error: "Failed to delete mapping", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
