import { NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";

export const runtime = 'edge';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const startTime = searchParams.get("start_time");
  const endTime = searchParams.get("end_time");
  const bucketWidth = searchParams.get("bucket_width") || "1d";
  const groupBy = searchParams.get("group_by") || "api_key_id";

  // Set limit based on bucket_width to avoid exceeding API limits
  // 1m (1 minute): max 1440, 1h (1 hour): max 168, 1d (1 day): max 31
  let defaultLimit = "31";
  if (bucketWidth === "1m") defaultLimit = "1440";
  else if (bucketWidth === "1h") defaultLimit = "168";

  const limit = searchParams.get("limit") || defaultLimit;

  // Read the admin key from Cloudflare Pages bindings when on Pages,
  // and fall back to process.env for local/dev.
  const cfEnv = (getRequestContext?.().env ?? undefined) as
    | Record<string, string>
    | undefined;
  const apiKey = cfEnv?.OPENAI_ADMIN_KEY ?? process.env.OPENAI_ADMIN_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_ADMIN_KEY not configured" },
      { status: 500 }
    );
  }

  if (!startTime) {
    return NextResponse.json(
      { error: "start_time parameter is required" },
      { status: 400 }
    );
  }

  try {
    // Build URL with optional grouping
    let url = `https://api.openai.com/v1/organization/usage/completions?start_time=${startTime}&limit=${limit}&bucket_width=${bucketWidth}`;

    // Only add group_by if it's not 'none'
    if (groupBy !== "none") {
      url += `&group_by=${groupBy}`;
    }

    if (endTime) {
      url += `&end_time=${endTime}`;
    }

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("OpenAI API Error:", errorData);
      return NextResponse.json(
        { error: "Failed to fetch usage data from OpenAI", details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();

    // If there's pagination and more data, fetch subsequent pages
    let allData = [...(data.data || [])];
    let nextPage = data.next_page as string | null | undefined;

    // Fetch up to 10 pages to avoid excessive requests
    let pageCount = 1;
    while (nextPage && pageCount < 10) {
      let nextUrl = `https://api.openai.com/v1/organization/usage/completions?start_time=${startTime}&limit=${limit}&bucket_width=${bucketWidth}`;
      if (groupBy !== "none") {
        nextUrl += `&group_by=${groupBy}`;
      }
      nextUrl += `${endTime ? `&end_time=${endTime}` : ""}&page=${nextPage}`;

      const nextResponse = await fetch(nextUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      });

      if (nextResponse.ok) {
        const nextData = await nextResponse.json();
        allData = [...allData, ...(nextData.data || [])];
        nextPage = nextData.next_page;
        pageCount++;
      } else {
        break;
      }
    }

    return NextResponse.json({
      object: "page",
      data: allData,
      has_more: !!nextPage,
      next_page: nextPage,
    });
  } catch (error) {
    console.error("Error fetching OpenAI usage:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
