# Investor Database Agent 🚀

> An autonomous AI agent that helps founders build and manage a personalized investor database through Slack and Notion

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

**Investor Database Agent** is a production-ready AI agent that interacts with founders directly in Slack to research, enrich, and organize venture capital, family office, and angel investor leads in a Notion database. Built with Claude AI, it provides intelligent matching and comprehensive investor intelligence to optimize your capital raise.

## ✨ Features

### 🤖 Intelligent Research
- **AI-Powered Research**: Uses Claude (Anthropic) to research any VC, family office, or angel investor
- **Investment Thesis Extraction**: Automatically identifies what investors look for
- **Portfolio Analysis**: Analyzes recent investments to understand preferences
- **Industry & Stage Mapping**: Identifies focus areas and funding stages

### 🎯 Smart Matching
- **Autonomous Discovery**: Finds investors that match your specific startup profile
- **Match Scoring**: 0-100 score based on industry, stage, geography, and check size alignment
- **Match Reasoning**: Detailed explanations of why each investor is a good fit
- **Personalized Recommendations**: Tailored to your startup's unique characteristics

### 📊 Data Enrichment
- **Multi-Source Enrichment**: Combines AI research, web scraping, and external APIs
- **Crunchbase Integration**: Enhanced data from Crunchbase (optional)
- **Contact Information**: Finds websites, LinkedIn profiles, and email addresses
- **Geographic Analysis**: Identifies investment regions and preferences

### 💬 Slack Integration
- **Natural Language Interface**: Just talk to the bot naturally
- **Real-Time Notifications**: Get updates as research completes
- **Threaded Conversations**: Organized responses for each request
- **Interactive Previews**: Review investor data before adding to database

### 📝 Notion Database
- **Automatic Organization**: All data synced to your Notion workspace
- **Rich Schema**: 15+ fields including thesis, industries, stages, geography, contacts
- **Match Tracking**: Scores and reasoning saved for prioritization
- **Customizable**: Adapt the database schema to your needs

### ⚡ Production-Ready
- **Concurrent Processing**: Handle multiple research requests simultaneously
- **Retry Logic**: Automatic retries for network failures
- **Error Handling**: Comprehensive error handling and logging
- **Rate Limiting**: Configurable concurrency and timeouts
- **Health Checks**: Built-in health monitoring endpoint

## 🎬 Quick Start

### Prerequisites
- Node.js 18+
- Slack workspace (admin access to install apps)
- Notion workspace
- Anthropic API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/investor-database-agent.git
   cd investor-database-agent
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

4. **Build and run**
   ```bash
   npm run build
   npm start
   ```

For detailed setup instructions, see [SETUP.md](./SETUP.md).

## 📖 Usage

### Basic Commands

**Add a specific investor:**
```
@InvestorAgent add Sequoia Capital
@InvestorAgent research a16z
```

**Find matching investors:**
```
@InvestorAgent find investors for my SaaS startup
@InvestorAgent find seed stage investors in fintech
```

**Manage your profile:**
```
@InvestorAgent set profile
```

**List your database:**
```
@InvestorAgent list investors
```

For complete usage guide and workflows, see [USAGE.md](./USAGE.md).

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Slack Bot                           │
│  (Socket Mode - Real-time event handling)                   │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│                     Message Handler                         │
│  (Intent parsing, natural language understanding)           │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│                      Orchestrator                           │
│  (Task queue, concurrency management, notifications)        │
└──────┬───────────────────────┬──────────────────────────────┘
       │                       │
       ▼                       ▼
┌─────────────┐         ┌──────────────┐
│  AI Agent   │         │  Enrichment  │
│  (Claude)   │         │   Service    │
└──────┬──────┘         └──────┬───────┘
       │                       │
       │                       ▼
       │              ┌─────────────────┐
       │              │  Web Scraping   │
       │              │  Crunchbase API │
       │              └─────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│                     Notion Service                          │
│  (Database CRUD, schema management)                         │
└─────────────────────────────────────────────────────────────┘
```

### Key Components

- **Slack Bot**: Handles real-time events and user interactions
- **AI Agent**: Claude-powered research and matching
- **Orchestrator**: Manages task queue and coordinates services
- **Enrichment Service**: Multi-source data enrichment
- **Notion Service**: Database synchronization and management

## 🛠️ Configuration

### Environment Variables

```env
# Required
SLACK_BOT_TOKEN=xoxb-your-token
SLACK_SIGNING_SECRET=your-secret
SLACK_APP_TOKEN=xapp-your-token
NOTION_API_KEY=secret_your-key
NOTION_DATABASE_ID=your-database-id
ANTHROPIC_API_KEY=sk-ant-your-key

# Optional
CRUNCHBASE_API_KEY=your-key
MAX_CONCURRENT_RESEARCH=3
RESEARCH_TIMEOUT_MS=300000
LOG_LEVEL=info
```

### Customization

- **Concurrency**: Adjust `MAX_CONCURRENT_RESEARCH` for your needs
- **Timeouts**: Configure `RESEARCH_TIMEOUT_MS` based on network speed
- **Logging**: Set `LOG_LEVEL` (error, warn, info, debug)
- **Notion Schema**: Customize database properties in `src/services/notion/client.ts`

## 📚 Documentation

- [**SETUP.md**](./SETUP.md) - Complete setup guide (Slack, Notion, deployment)
- [**USAGE.md**](./USAGE.md) - Usage guide, workflows, and examples
- [**ARCHITECTURE.md**](./ARCHITECTURE.md) - Technical architecture and design decisions

## 🧪 Development

```bash
# Run in development mode with hot-reload
npm run dev

# Build TypeScript
npm run build

# Run linter
npm run lint

# Format code
npm run format

# Run tests
npm test
```

## 🚀 Deployment

### Quick Deploy Options

**Railway**
```bash
# Connect GitHub repo and deploy
```

**Docker**
```bash
docker build -t investor-agent .
docker run -d --env-file .env investor-agent
```

**PM2 (VPS)**
```bash
npm install -g pm2
pm2 start dist/index.js --name investor-agent
pm2 save
```

See [SETUP.md](./SETUP.md#deployment) for detailed deployment instructions.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Anthropic** for Claude AI
- **Slack** for the Bolt framework
- **Notion** for the API and database platform

## 📧 Support

- **Documentation**: See [SETUP.md](./SETUP.md) and [USAGE.md](./USAGE.md)
- **Issues**: [GitHub Issues](https://github.com/yourusername/investor-database-agent/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/investor-database-agent/discussions)

---

**Built with ❤️ for founders raising capital**
