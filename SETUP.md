# Investor Database Agent - Setup Guide

Complete setup guide for the VC/Angel Investor Lead Research Agent.

## Prerequisites

- Node.js 18+ installed
- A Slack workspace where you can install apps
- A Notion account and workspace
- An Anthropic API key (Claude)
- (Optional) Crunchbase API key for enhanced enrichment

## Table of Contents

1. [Slack App Setup](#slack-app-setup)
2. [Notion Database Setup](#notion-database-setup)
3. [Environment Configuration](#environment-configuration)
4. [Installation](#installation)
5. [Running the Agent](#running-the-agent)
6. [Deployment](#deployment)

---

## 1. Slack App Setup

### Create a Slack App

1. Go to [api.slack.com/apps](https://api.slack.com/apps)
2. Click **"Create New App"** → **"From scratch"**
3. Name it "Investor Database Agent" and select your workspace

### Configure OAuth & Permissions

Add the following **Bot Token Scopes**:

```
app_mentions:read
channels:history
channels:read
chat:write
chat:write.public
commands
groups:history
im:history
im:read
im:write
users:read
```

### Enable Socket Mode

1. Go to **Settings** → **Socket Mode**
2. Enable Socket Mode
3. Generate an App-Level Token with `connections:write` scope
4. Save the token (starts with `xapp-`)

### Enable Event Subscriptions

Subscribe to these bot events:

```
app_mention
message.channels
message.im
```

### Create Slash Commands (Optional)

Create these slash commands:

| Command | Description | Usage Hint |
|---------|-------------|------------|
| `/vc-add` | Add a specific investor | investor name |
| `/vc-find` | Find matching investors | search criteria |
| `/vc-profile` | Set startup profile | - |
| `/vc-list` | List all investors | - |
| `/vc-help` | Show help | - |

For each, set Request URL to your bot's URL (can be placeholder initially).

### Install App to Workspace

1. Go to **Settings** → **Install App**
2. Click **"Install to Workspace"**
3. Authorize the app
4. Copy the **Bot User OAuth Token** (starts with `xoxb-`)

### Get Signing Secret

1. Go to **Settings** → **Basic Information**
2. Under **App Credentials**, copy the **Signing Secret**

---

## 2. Notion Database Setup

### Create a Notion Integration

1. Go to [notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Click **"+ New integration"**
3. Name it "Investor Database Agent"
4. Select your workspace
5. Copy the **Internal Integration Token** (starts with `secret_`)

### Create the Investor Database

1. In Notion, create a new **Database** (table view recommended)
2. Name it "Investor Leads" or similar
3. Add these properties:

| Property Name | Type | Description |
|---------------|------|-------------|
| Name | Title | Investor/firm name |
| Type | Select | Options: VC, Family Office, Angel |
| Firm Name | Text | Firm name if applicable |
| Investment Thesis | Text | Their investment focus |
| Industries | Multi-select | Industries they invest in |
| Stages | Multi-select | Investment stages (Pre-seed, Seed, Series A, etc.) |
| Check Size | Text | Investment range |
| Geography | Multi-select | Geographic regions |
| Website | URL | Company website |
| LinkedIn | URL | LinkedIn profile |
| Email | Email | Contact email |
| Match Score | Number | AI match score (0-100) |
| Match Reason | Text | Why this is a good match |
| Last Updated | Date | Last update timestamp |
| Source | Select | Options: AI Research, AI Match, Manual, etc. |
| Notes | Text | Additional notes |

### Share Database with Integration

1. Open your database in Notion
2. Click **"•••"** (top right) → **"Add connections"**
3. Select your integration
4. Copy the **Database ID** from the URL:
   - URL format: `notion.so/workspace/{database_id}?v=...`
   - The database ID is the 32-character hex string

---

## 3. Environment Configuration

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Fill in your credentials:

```env
# Slack Configuration
SLACK_BOT_TOKEN=xoxb-your-bot-token-here
SLACK_SIGNING_SECRET=your-signing-secret-here
SLACK_APP_TOKEN=xapp-your-app-token-here

# Notion Configuration
NOTION_API_KEY=secret_your-notion-integration-token
NOTION_DATABASE_ID=your-database-id-here

# Anthropic Configuration
ANTHROPIC_API_KEY=sk-ant-your-anthropic-api-key

# Optional: External APIs
CRUNCHBASE_API_KEY=your-crunchbase-key  # Optional but recommended
PITCHBOOK_API_KEY=your-pitchbook-key    # Optional

# Application Configuration
NODE_ENV=development
PORT=3000
LOG_LEVEL=info

# Rate Limiting
MAX_CONCURRENT_RESEARCH=3
RESEARCH_TIMEOUT_MS=300000
```

---

## 4. Installation

Install dependencies:

```bash
npm install
```

Build the TypeScript code:

```bash
npm run build
```

---

## 5. Running the Agent

### Development Mode

With hot-reload:

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

The agent will:
1. ✅ Validate Notion database connection
2. ✅ Connect to Slack via Socket Mode
3. ✅ Start listening for messages and commands

You should see:

```
[INFO]: ✅ Investor Database Agent is running!
```

---

## 6. Deployment

### Option 1: Traditional VPS/Server

1. Install Node.js 18+ on your server
2. Clone the repository
3. Set up environment variables
4. Install dependencies: `npm install`
5. Build: `npm run build`
6. Use a process manager like PM2:

```bash
npm install -g pm2
pm2 start dist/index.js --name investor-agent
pm2 save
pm2 startup
```

### Option 2: Docker

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

CMD ["node", "dist/index.js"]
```

Build and run:

```bash
docker build -t investor-agent .
docker run -d --env-file .env --name investor-agent investor-agent
```

### Option 3: Cloud Platforms

#### Railway
1. Connect your GitHub repo
2. Add environment variables
3. Deploy automatically

#### Heroku
```bash
heroku create investor-database-agent
heroku config:set SLACK_BOT_TOKEN=xoxb-...
# Set all other env vars
git push heroku main
```

#### Render
1. Create a new Web Service
2. Connect repository
3. Set environment variables
4. Deploy

---

## Testing the Setup

### 1. Test in Slack

Send a message to your bot:

```
@InvestorAgent help
```

You should receive the help message.

### 2. Add an Investor

```
@InvestorAgent add Sequoia Capital
```

The bot should:
1. Acknowledge the request
2. Research the investor
3. Show a preview
4. Add to Notion database
5. Send confirmation

### 3. Check Notion

Verify that the investor appears in your Notion database with enriched data.

---

## Troubleshooting

### Bot not responding

- Check that Socket Mode is enabled
- Verify all environment variables are set
- Check logs for connection errors
- Ensure bot is invited to channels where you're messaging

### Notion errors

- Verify integration is connected to database
- Check database ID is correct
- Ensure all required properties exist in database
- Verify integration has write permissions

### Rate limiting

- Adjust `MAX_CONCURRENT_RESEARCH` if hitting rate limits
- Increase `RESEARCH_TIMEOUT_MS` for slow networks

### Missing data

- Some investors may have limited public information
- Add Crunchbase API key for better enrichment
- Data quality depends on AI research accuracy

---

## Next Steps

- Customize the Notion database schema for your needs
- Add more enrichment sources
- Configure startup profile for better matching
- Set up monitoring and alerts
- Review and refine investor matches

For support, check the [main README](./README.md) or open an issue on GitHub.
