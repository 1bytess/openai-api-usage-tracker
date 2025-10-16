OpenAI Usage Tracker (Next.js)

A beautiful, secure web app to track OpenAI API usage per user/API key and by model tiers (Mini/Nano 2.5M tokens, Base/Pro 250K tokens). Simple JSON-based configuration for easy management.

## Features

- Real-time OpenAI usage tracking by user and model
- Simple JSON file configuration for API key mappings
- Dark mode UI with responsive design
- Track usage against free tier limits (Mini/Nano: 2.5M tokens/day, Base/Pro: 250K tokens/day)
- Secure server routes that proxy calls to the OpenAI Organization Usage API
- Zero secrets committed to Git - all sensitive data in environment variables

## Quick Start

1) Install deps
```bash
npm install
```

2) Configure API key mappings
Edit `src/lib/apiKeyMappings.json` to add your API key IDs and usernames:
```json
{
  "key_abc123xyz": "John Doe",
  "key_def456abc": "Jane Smith"
}
```

3) Configure environment
```bash
cp .env.example .env
# Edit .env and set OPENAI_ADMIN_KEY
```

4) Run
```bash
npm run dev
```

Open http://localhost:3000

## API Endpoints

- `GET /api/usage?start_time=<unix>&end_time=<unix>&bucket_width=1d&group_by=api_key_id` - Fetch usage data from OpenAI
- `GET /api/health` - Health check

**Security Notes:**
- Only server routes access `OPENAI_ADMIN_KEY`; the key is never exposed to the client
- `group_by` supports `api_key_id`, `model`, or `none`
- `bucket_width`: `1m`, `1h`, `1d` (sets safe `limit` defaults to avoid API caps)

## Configuration

API key mappings are stored in `src/lib/apiKeyMappings.json`:

```json
{
  "key_UlNZ6qS2brN8b3UX": "Ezra",
  "key_drh7ecJBICST6X5s": "Admin",
  "key_XTkL0QphBNC0p22F": "Ted",
  "key_MrkryH12NfCGEGaH": "Isaiah"
}
```

## Deployment

### Option A: Vercel (Easiest)

1. Push to GitHub
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import repository
4. Add environment variable: `OPENAI_ADMIN_KEY`
5. Deploy

### Option B: Cloudflare Pages (Recommended for this project)

The project includes `wrangler.toml` configured for Cloudflare Pages.

**Quick Deploy:**

1. Install dependencies:
```bash
npm install --save-dev @cloudflare/next-on-pages wrangler
```

2. Push to GitHub and connect via Cloudflare Pages dashboard:
   - Framework: **Next.js**
   - Build command: `npx @cloudflare/next-on-pages`
   - Build output: `.vercel/output/static`
   - Add environment variable: `OPENAI_ADMIN_KEY`

**Or deploy via CLI:**
```bash
# Build for Cloudflare
npx @cloudflare/next-on-pages

# Deploy
npx wrangler pages deploy .vercel/output/static --project-name=openai-usage-tracker

# Set secret
npx wrangler pages secret put OPENAI_ADMIN_KEY --project-name=openai-usage-tracker
```

**Local Cloudflare dev:**
```bash
npm run pages:build
npm run pages:dev
```

### Option C: Netlify

1. Push to GitHub
2. Connect via [Netlify](https://app.netlify.com)
3. Build command: `npm run build`
4. Publish directory: `.next`
5. Add environment variable: `OPENAI_ADMIN_KEY`

## Managing API Key Mappings

To add or remove users:

1. Edit `src/lib/apiKeyMappings.json` and add/remove mappings:
```json
{
  "key_abc123xyz": "John Doe",
  "key_def456abc": "Jane Smith"
}
```

2. Commit and push changes to trigger automatic redeployment (if using CI/CD)

**Tips:**
- Find your API key IDs in your OpenAI dashboard under API keys
- The format is always `key_` followed by alphanumeric characters
- Make sure the JSON is valid (no trailing commas, proper quotes)

## Customize

- API key mappings are stored in `src/lib/apiKeyMappings.json`
- Adjust tier limits in `src/app/page.tsx:123-124` (nano_mini and base_pro limits)
- Modify UI styles in `src/app/globals.css` or component classes
- Update model categorization logic in `src/app/page.tsx:138-148` to match your model usage
