<h1 align="center">OpenAI API Usage Tracker</h1>

<p align="center">
  <strong>Monitor OpenAI API usage and free credit limits with a beautiful, responsive dashboard</strong>
</p>

<p align="center">
  <img src="demo.gif" alt="OpenAI Usage Tracker Demo" width="800">
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#docker-deployment">Docker</a> •
  <a href="#configuration">Configuration</a> •
  <a href="#deployment">Deployment</a>
</p>

---

## 🚀 Features

- **📊 Real-time Usage Tracking** - Monitor OpenAI API usage by user, API key, and model
- **🎯 Tier Management** - Track usage against free tier limits (Mini/Nano: 2.5M tokens/day, Base/Pro: 250K tokens/day)
- **👥 User Management** - Simple JSON-based configuration for API key-to-user mappings
- **🎨 Modern UI** - Dark mode interface with responsive design built on Next.js 15 and React 19
- **🔒 Secure by Design** - Server-side API proxy ensures admin keys never reach the client
- **🐳 Docker Ready** - One-command deployment with Docker and Docker Compose
- **⚡ Fast Performance** - Built with Next.js Turbopack for optimal speed

## 📋 Prerequisites

- Node.js 18+ (or Docker)
- OpenAI Organization Admin API Key
- Your OpenAI API Key IDs for tracking

## 🏃 Quick Start

### Option 1: Local Development

**1. Clone the repository**
```bash
git clone https://github.com/1bytess/openai-usage-tracker.git
cd openai-usage-tracker
```

**2. Install dependencies**
```bash
npm install
```

**3. Configure API key mappings**

Edit `src/lib/apiKeyMappings.json` to map your API key IDs to user names:

```json
{
  "key_abc123xyz": "John Doe",
  "key_def456abc": "Jane Smith"
}
```

> 💡 Find your API key IDs in the [OpenAI Dashboard](https://platform.openai.com/api-keys) under API keys (format: `key_` followed by alphanumeric characters)

**4. Set up environment variables**
```bash
cp .env.example .env
```

Edit `.env` and add your OpenAI Admin API key:
```env
OPENAI_ADMIN_KEY=your_openai_admin_key_here
```

**5. Run the development server**
```bash
npm run dev
```

**6. Open your browser**
```
http://localhost:3000
```

### Option 2: Docker Deployment 🐳 {#docker-deployment}

**Quick start with Docker Compose:**

```bash
# Clone and navigate to the project
git clone https://github.com/1bytess/openai-usage-tracker.git
cd openai-usage-tracker

# Configure your API key mappings
# Edit src/lib/apiKeyMappings.json

# Set up environment variables
cp .env.example .env
# Edit .env and add your OPENAI_ADMIN_KEY

# Build and run
docker-compose up -d

# View logs
docker-compose logs -f
```

The application will be available at `http://localhost:3000`

**Docker commands:**
```bash
# Stop the application
docker-compose down

# Rebuild after code changes
docker-compose up -d --build

# View logs
docker-compose logs -f app
```

## ⚙️ Configuration

### API Key Mappings

API key mappings are stored in `src/lib/apiKeyMappings.json`:

```json
{
  "key_UlNZ6qS2brN8b3UX": "Ezra",
  "key_drh7ecJBICST6X5s": "Admin",
  "key_XTkL0QphBNC0p22F": "Ted",
  "key_MrkryH12NfCGEGaH": "Isaiah"
}
```

**To add or remove users:**

1. Edit `src/lib/apiKeyMappings.json`
2. Add/remove key-to-username mappings
3. Ensure valid JSON (no trailing commas, proper quotes)
4. Restart the application or redeploy

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_ADMIN_KEY` | OpenAI Organization Admin API Key | ✅ Yes |

### Customization

- **Tier Limits**: Adjust in `src/app/page.tsx:123-124`
- **UI Styles**: Modify `src/app/globals.css` or component classes
- **Model Categorization**: Update logic in `src/app/page.tsx:138-148`

## 🌐 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/usage` | GET | Fetch usage data from OpenAI |
| `/api/health` | GET | Health check endpoint |

**Query Parameters for `/api/usage`:**
- `start_time` - Unix timestamp (required)
- `end_time` - Unix timestamp (required)
- `bucket_width` - Time bucket: `1m`, `1h`, or `1d` (default: `1d`)
- `group_by` - Grouping: `api_key_id`, `model`, or `none` (default: `api_key_id`)

**Security Notes:**
- ✅ Admin API key stored server-side only
- ✅ Never exposed to client
- ✅ Secure proxy pattern for OpenAI API calls

## 🚀 Deployment

### Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

1. Push your repository to GitHub
2. Import to [Vercel](https://vercel.com/new)
3. Add environment variable: `OPENAI_ADMIN_KEY`
4. Deploy

### Cloudflare Pages

The project includes `wrangler.toml` for Cloudflare Pages deployment.

**Dashboard Deployment:**
1. Connect repository in [Cloudflare Pages](https://dash.cloudflare.com/pages)
2. Configure:
   - Framework: **Next.js**
   - Build command: `npx @cloudflare/next-on-pages`
   - Build output: `.vercel/output/static`
3. Add environment variable: `OPENAI_ADMIN_KEY`

**CLI Deployment:**
```bash
# Build for Cloudflare
npx @cloudflare/next-on-pages

# Deploy
npx wrangler pages deploy .vercel/output/static --project-name=openai-usage-tracker

# Set secret
npx wrangler pages secret put OPENAI_ADMIN_KEY --project-name=openai-usage-tracker
```

**Local Cloudflare Development:**
```bash
npm run pages:build
npm run pages:dev
```

### Netlify

1. Connect repository to [Netlify](https://app.netlify.com)
2. Configure:
   - Build command: `npm run build`
   - Publish directory: `.next`
3. Add environment variable: `OPENAI_ADMIN_KEY`

### Docker Production Deployment

**Using Docker Compose:**
```bash
docker-compose -f docker-compose.yml up -d
```

**Manual Docker:**
```bash
# Build
docker build -t openai-usage-tracker .

# Run
docker run -d \
  -p 3000:3000 \
  -e OPENAI_ADMIN_KEY=your_key_here \
  -v $(pwd)/src/lib/apiKeyMappings.json:/app/src/lib/apiKeyMappings.json \
  --name openai-tracker \
  openai-usage-tracker
```

## 🛠️ Tech Stack

- **Framework**: Next.js 15 with Turbopack
- **Runtime**: React 19
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Language**: TypeScript
- **Deployment**: Docker, Vercel, Cloudflare Pages, Netlify

## 📁 Project Structure

```
openai-usage-tracker/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── health/         # Health check endpoint
│   │   │   └── usage/          # Usage data proxy endpoint
│   │   ├── globals.css         # Global styles
│   │   ├── layout.tsx          # Root layout
│   │   └── page.tsx            # Main dashboard
│   └── lib/
│       ├── apiKeyMappings.json # API key to user mappings
│       └── apiKeys.ts          # API key utilities
├── docker-compose.yml          # Docker Compose configuration
├── Dockerfile                  # Docker build instructions
├── .dockerignore              # Docker ignore patterns
└── README.md                  # This file
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Icons by [Lucide](https://lucide.dev/)
- Powered by [OpenAI API](https://platform.openai.com/)

## 📞 Support

If you encounter any issues or have questions:
- Open an [Issue](https://github.com/1bytess/openai-usage-tracker/issues)
- Check existing issues for solutions
- Contribute to discussions

---

<p align="center">Made with ❤️ for the OpenAI community</p>
