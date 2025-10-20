# API Key Mappings with Cloudflare KV - Setup Guide

This guide will help you set up dynamic API key mappings using Cloudflare KV storage.

## Overview

Instead of updating the static `apiKeyMappings.json` file, you can now:
- Add new API key mappings directly from the UI
- Mappings are stored in Cloudflare KV (edge storage)
- Changes are instant and globally available
- No need to redeploy when adding new API keys

## Prerequisites

- Cloudflare account
- Project deployed to Cloudflare Pages
- Wrangler CLI installed (`npm install -g wrangler`)

## Setup Steps

### 1. Create KV Namespace

Run these commands to create the KV namespaces:

```bash
# Create production KV namespace
wrangler kv:namespace create "API_KEY_MAPPINGS"

# Create preview KV namespace (for testing)
wrangler kv:namespace create "API_KEY_MAPPINGS" --preview
```

You'll get output like this:
```
🌀 Creating namespace with title "openai-usage-tracker-API_KEY_MAPPINGS"
✨ Success!
Add the following to your wrangler.toml:
[[kv_namespaces]]
binding = "API_KEY_MAPPINGS"
id = "abcdef1234567890abcdef1234567890"
```

### 2. Update wrangler.toml

Copy the IDs from the previous step and update `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "API_KEY_MAPPINGS"
id = "your-production-kv-namespace-id"  # Replace with your actual ID
preview_id = "your-preview-kv-namespace-id"  # Replace with your actual preview ID
```

### 3. Configure KV Binding in Cloudflare Pages Dashboard

Since you're using Cloudflare Pages, you also need to bind the KV namespace in the dashboard:

1. Go to your Cloudflare Pages project
2. Navigate to **Settings** > **Functions**
3. Scroll to **KV namespace bindings**
4. Click **Add binding**
5. Set:
   - **Variable name**: `API_KEY_MAPPINGS`
   - **KV namespace**: Select your created namespace
6. Save

Do this for both **Production** and **Preview** environments.

### 4. Deploy Your Application

Build and deploy:

```bash
npm run build
npm run pages:deploy
```

Or push to your git repository if auto-deployment is enabled.

### 5. Migrate Existing Mappings (One-time)

After deployment, migrate your existing mappings from `apiKeyMappings.json` to KV:

Visit this URL in your browser (replace with your actual domain):
```
https://your-domain.pages.dev/api/migrate-mappings
```

You should see a success response with migration details.

**Alternative**: Manually add mappings via the UI (see Usage section below).

## Usage

### Adding a New Mapping via UI

1. Go to your application homepage
2. Click **"Add Mapping"** button
3. Enter:
   - **API Key ID**: The OpenAI API key ID (e.g., `key_UlNZ6qS2brN8b3UX`)
   - **User Name**: The friendly name (e.g., `John Doe`)
4. Click **"Save Mapping"**

The mapping is instantly available globally!

### Viewing Current Mappings

1. Click **"View Mappings"** button
2. See all current mappings
3. Delete any mapping by clicking the trash icon

### Adding Mappings via API

You can also use the API directly:

```bash
curl -X POST https://your-domain.pages.dev/api/mappings \
  -H "Content-Type: application/json" \
  -d '{"apiKeyId": "key_ABC123XYZ", "userName": "Jane Doe"}'
```

## How It Works

### Architecture

1. **KV Storage**: Mappings are stored in Cloudflare KV as a single JSON object
2. **API Routes**:
   - `GET /api/mappings` - Fetch all mappings
   - `POST /api/mappings` - Add/update a mapping
   - `DELETE /api/mappings` - Remove a mapping
3. **Client Cache**: Mappings are cached in-memory for 1 minute to reduce API calls
4. **Fallback**: In local development, falls back to `apiKeyMappings.json`

### Files Created/Modified

**New Files:**
- `src/app/api/mappings/route.ts` - API endpoints for KV operations
- `src/app/api/migrate-mappings/route.ts` - Migration endpoint
- `src/components/ApiKeyMappingManager.tsx` - UI component
- `scripts/migrate-to-kv.ts` - Migration utility

**Modified Files:**
- `src/lib/apiKeys.ts` - Now fetches from API with caching
- `src/app/page.tsx` - Added mapping manager component
- `wrangler.toml` - Added KV namespace configuration

## Local Development

In local development (non-Cloudflare environment):
- API will automatically fall back to `apiKeyMappings.json`
- You'll see a message that KV is not configured (this is expected)
- You can still test the UI, but changes won't persist

To test with KV locally:
```bash
npm run pages:dev
```

This runs the app with Cloudflare Pages emulation.

## Troubleshooting

### "KV namespace not configured" Error

**Problem**: The KV binding isn't available.

**Solutions**:
1. Verify KV namespace is created: `wrangler kv:namespace list`
2. Check `wrangler.toml` has correct IDs
3. Ensure KV binding is added in Cloudflare Pages dashboard
4. Redeploy the application

### Mappings Not Updating

**Problem**: New mappings don't show up.

**Solutions**:
1. Check browser console for errors
2. Clear browser cache (1-minute cache on mappings)
3. Verify the mapping was saved: Visit `/api/mappings` directly
4. Check Cloudflare Pages Functions logs

### Migration Endpoint Returns Error

**Problem**: `/api/migrate-mappings` fails.

**Solutions**:
1. Ensure you're accessing the production URL (not localhost)
2. Verify KV namespace is properly bound
3. Check Cloudflare Pages Functions logs

## Cost

Cloudflare KV is included in the free tier with generous limits:
- **100,000 reads/day**
- **1,000 writes/day**
- **1 GB storage**

For this use case (API key mappings), you'll stay well within free limits.

## Security Notes

- The API endpoints are public (no authentication)
- Anyone with access to your domain can add/remove mappings
- Consider adding authentication if this is a concern
- Recommendation: Use Cloudflare Access or custom auth if needed

## Next Steps

1. Complete the setup steps above
2. Migrate existing mappings
3. Test adding a new mapping via UI
4. Remove the old `apiKeyMappings.json` file (optional, kept as fallback)

## Questions?

If you encounter issues, check:
1. Cloudflare Pages Functions logs
2. Browser console for client-side errors
3. Network tab for API request/response details
