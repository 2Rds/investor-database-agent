# Architecture Documentation

Technical architecture and design decisions for the Investor Database Agent.

## Table of Contents

1. [System Overview](#system-overview)
2. [Component Architecture](#component-architecture)
3. [Data Flow](#data-flow)
4. [Design Decisions](#design-decisions)
5. [Scalability](#scalability)
6. [Security](#security)

---

## System Overview

The Investor Database Agent is a TypeScript-based application that orchestrates multiple services to provide intelligent investor research and database management capabilities.

### Tech Stack

- **Runtime**: Node.js 18+
- **Language**: TypeScript 5.3
- **AI**: Anthropic Claude 3.5 Sonnet
- **Communication**: Slack Bolt SDK (Socket Mode)
- **Database**: Notion API
- **Web Scraping**: Cheerio + Axios
- **Task Queue**: p-queue
- **Logging**: Winston
- **Validation**: Zod

### Core Principles

1. **Autonomous Operation**: Minimal human intervention required
2. **Resilience**: Comprehensive error handling and retries
3. **Scalability**: Concurrent processing with configurable limits
4. **Extensibility**: Plugin architecture for enrichment sources
5. **Type Safety**: Full TypeScript coverage

---

## Component Architecture

### 1. Slack Bot (`src/services/slack/bot.ts`)

**Responsibilities:**
- Listen for Slack events (mentions, messages, commands)
- Route events to appropriate handlers
- Manage Socket Mode connection
- Send messages and notifications

**Key Features:**
- Event-driven architecture
- Socket Mode for real-time communication
- Support for slash commands and interactive components
- Threaded message support

**Dependencies:**
- `@slack/bolt` for Slack integration
- MessageHandler for processing requests
- CommandHandler for slash commands

### 2. Message Handler (`src/handlers/messageHandler.ts`)

**Responsibilities:**
- Parse natural language input
- Determine user intent
- Coordinate with AI Agent and Orchestrator
- Format and send responses

**Intent Detection:**
```typescript
- Add investor: ["add", "research"]
- Find investors: ["find", "search", "match"]
- Profile management: ["profile", "startup"]
- List investors: ["list", "show"]
- Help: ["help"]
```

**Flow:**
```
User Message → Intent Parsing → Service Coordination → Response
```

### 3. Command Handler (`src/handlers/commandHandler.ts`)

**Responsibilities:**
- Handle Slack slash commands
- Process button clicks and interactions
- Direct command execution

**Commands:**
- `/vc-add [name]` - Add specific investor
- `/vc-find [criteria]` - Find matching investors
- `/vc-profile` - Set startup profile
- `/vc-list` - List all investors
- `/vc-help` - Show help

### 4. Orchestrator (`src/services/orchestrator.ts`)

**Responsibilities:**
- Manage research task queue
- Coordinate AI Agent, Enrichment, and Notion services
- Handle concurrent operations
- Send progress notifications

**Architecture:**
```typescript
class Orchestrator {
  private taskQueue: PQueue;
  private activeTasks: Map<string, ResearchTask>;
  private notificationCallbacks: Map<string, Function>;

  async researchAndAddInvestor(...)
  async findAndAddMatchingInvestors(...)
}
```

**Concurrency Model:**
- Uses `p-queue` for concurrent task management
- Configurable max concurrency (default: 3)
- Timeout enforcement per task
- Task status tracking

### 5. AI Agent (`src/services/ai/agent.ts`)

**Responsibilities:**
- Research individual investors using Claude
- Find matching investors based on startup profile
- Enrich incomplete data
- Calculate match scores

**Methods:**
```typescript
class AIAgent {
  async researchInvestor(name: string): Promise<InvestorLead>
  async findMatchingInvestors(profile: StartupProfile): Promise<InvestorLead[]>
  async enrichInvestorData(partial: Partial<InvestorLead>): Promise<Partial<InvestorLead>>
}
```

**Prompting Strategy:**
- Structured JSON output format
- Few-shot examples in prompts
- Temperature tuning (0.2-0.4 for factual tasks)
- Context inclusion for better accuracy

**Match Scoring Algorithm:**
```
Score = Industry Match (30)
      + Stage Match (25)
      + Geography Match (15)
      + Check Size Match (20)
      + Recent Activity (10)
Max: 100
```

### 6. Notion Service (`src/services/notion/client.ts`)

**Responsibilities:**
- CRUD operations on Notion database
- Schema validation
- Type transformations
- Query optimization

**Methods:**
```typescript
class NotionService {
  async addInvestor(lead: InvestorLead): Promise<string>
  async updateInvestor(pageId: string, data: Partial<InvestorLead>): Promise<void>
  async findInvestorByName(name: string): Promise<string | null>
  async getAllInvestors(): Promise<Array<{id: string, name: string}>>
}
```

**Schema Mapping:**
```
InvestorLead (TypeScript) ↔ Notion Database Properties
- Type-safe transformations
- Field validation
- Length limits (2000 chars for rich text)
```

### 7. Enrichment Service (`src/services/research/enrichment.ts`)

**Responsibilities:**
- Web scraping for investor data
- External API integration (Crunchbase, etc.)
- Data validation and cleaning
- Multi-source aggregation

**Enrichment Sources:**
1. **Web Scraping**: Company websites, about pages
2. **Crunchbase API**: Structured investor data
3. **LinkedIn**: Professional profiles (limited)
4. **Future**: PitchBook, AngelList, etc.

**Methods:**
```typescript
class EnrichmentService {
  async enrichFromWeb(name: string, website?: string): Promise<EnrichmentResult>
  async enrichFromCrunchbase(name: string): Promise<EnrichmentResult>
  async scrapeWebsite(url: string): Promise<string>
  combineEnrichmentResults(results: EnrichmentResult[]): Partial<InvestorLead>
}
```

---

## Data Flow

### Research Flow (Add Specific Investor)

```
User: "@InvestorAgent add Sequoia Capital"
   │
   ▼
[Slack Bot] Receive mention event
   │
   ▼
[Message Handler] Parse intent → "add investor"
   │
   ▼
[Orchestrator] Queue research task
   │
   ├─▶ [AI Agent] Research investor
   │        │
   │        └─▶ Claude API: Extract thesis, investments, focus areas
   │                 │
   │                 ▼
   │            InvestorLead (partial data)
   │
   ├─▶ [Enrichment Service] Enhance data
   │        │
   │        ├─▶ Web scraping: website content
   │        ├─▶ Crunchbase API: structured data
   │        └─▶ Combine results
   │                 │
   │                 ▼
   │            EnrichedData
   │
   ├─▶ Merge AI + Enriched data
   │        │
   │        ▼
   │   Complete InvestorLead
   │
   └─▶ [Notion Service] Add to database
            │
            ▼
       Notion Page Created
            │
            ▼
   [Slack Bot] Send confirmation
            │
            ▼
       User receives notification
```

### Matching Flow (Find Investors)

```
User: "@InvestorAgent find investors for my SaaS startup"
   │
   ▼
[Message Handler] Extract startup profile
   │
   ▼
[Orchestrator] Queue matching task
   │
   ▼
[AI Agent] Find matching investors
   │     │
   │     └─▶ Claude API:
   │           - Analyze startup profile
   │           - Identify relevant investors
   │           - Calculate match scores
   │           - Generate match reasoning
   │                │
   │                ▼
   │         List<InvestorLead> with match scores
   │
   └─▶ For each investor:
         [Notion Service] Add to database
              │
              ▼
         [Slack Bot] Send progress updates
              │
              ▼
         User receives top matches
```

---

## Design Decisions

### 1. Why Socket Mode for Slack?

**Chosen:** Socket Mode
**Alternative:** HTTP endpoints + ngrok/tunneling

**Reasoning:**
- No public endpoint required
- Simpler deployment (no SSL/domain needed)
- Real-time event delivery
- Better for development and testing
- Reduced infrastructure complexity

**Trade-off:** Requires persistent connection (handled by Slack SDK)

### 2. Why Notion as Database?

**Chosen:** Notion API
**Alternatives:** Airtable, Google Sheets, PostgreSQL

**Reasoning:**
- User-facing interface (founders see and interact with data)
- Built-in collaboration features
- Rich property types (multi-select, URLs, etc.)
- No separate UI needed
- Familiar to target users (founders)

**Trade-offs:**
- API rate limits (3 requests/second)
- Limited query capabilities
- Eventual consistency

### 3. Why Claude for Research?

**Chosen:** Anthropic Claude 3.5 Sonnet
**Alternatives:** GPT-4, open-source models

**Reasoning:**
- Superior long-context understanding
- Strong JSON formatting reliability
- Detailed reasoning capabilities
- Better at nuanced research tasks
- Constitutional AI for safety

**Model Selection:**
- **Claude 3.5 Sonnet**: Balance of speed, cost, and quality
- Future: Claude Opus for complex matching

### 4. Task Queue Architecture

**Chosen:** p-queue with in-memory state
**Alternatives:** Redis Queue, Bull, AWS SQS

**Reasoning:**
- Simple deployment (no Redis needed)
- Sufficient for single-instance operation
- Low latency
- Built-in concurrency control

**Limitation:** Not distributed (addressed in scaling section)

### 5. TypeScript Over JavaScript

**Reasoning:**
- Type safety prevents runtime errors
- Better IDE support
- Self-documenting code
- Easier refactoring
- Required for production apps

### 6. Retry Strategy

**Implementation:**
```typescript
withRetry(fn, {
  retries: 3,
  minTimeout: 1000,
  maxTimeout: 5000,
  factor: 2  // Exponential backoff
})
```

**Reasoning:**
- Network failures are common
- API rate limits need backing off
- Transient errors should be retried
- Exponential backoff prevents thundering herd

---

## Scalability

### Current Limitations (Single Instance)

1. **Concurrency**: Limited by `MAX_CONCURRENT_RESEARCH` (default: 3)
2. **Memory**: Task queue in memory (not persistent)
3. **Availability**: Single point of failure

### Scaling Strategies

#### Horizontal Scaling (Multiple Instances)

**Requirements:**
1. Replace in-memory queue with Redis/SQS
2. Distributed task coordination
3. Load balancer (not needed for Socket Mode)

**Implementation:**
```typescript
// Replace p-queue with Bull
import Queue from 'bull';

const researchQueue = new Queue('research', {
  redis: { host: 'redis-host', port: 6379 }
});

researchQueue.process('investor-research', async (job) => {
  // Process research task
});
```

#### Vertical Scaling

- Increase `MAX_CONCURRENT_RESEARCH`
- Add more CPU/RAM to instance
- Optimize AI prompts to reduce token usage

#### Caching Layer

```typescript
// Add Redis cache for investor data
const cache = new Redis();

async function getCachedInvestor(name: string) {
  const cached = await cache.get(`investor:${name}`);
  if (cached) return JSON.parse(cached);

  const data = await researchInvestor(name);
  await cache.set(`investor:${name}`, JSON.stringify(data), 'EX', 86400);
  return data;
}
```

#### Database Optimization

- Batch Notion API calls
- Cache Notion database queries
- Implement request deduplication

---

## Security

### API Key Management

- **Environment Variables**: All keys in `.env`
- **Never Commit**: `.env` in `.gitignore`
- **Validation**: Zod schema validates on startup
- **Rotation**: Support key rotation without downtime

### Slack Security

- **Signing Secret**: Verify request authenticity
- **Token Scopes**: Minimal required permissions
- **Socket Mode**: No public endpoints to attack

### Notion Security

- **Integration Permissions**: Database-level access only
- **Read/Write Only**: No admin permissions needed

### Data Privacy

- **No Storage**: Investor data only in Notion (user-controlled)
- **Logging**: No sensitive data in logs
- **Transmission**: HTTPS/WSS only

### Input Validation

```typescript
// Validate all user inputs
const investorNameSchema = z.string().min(1).max(200);
const profileSchema = z.object({
  name: z.string(),
  industry: z.string(),
  stage: z.enum(['pre_seed', 'seed', ...]),
  // ...
});
```

### Rate Limiting

- **Notion API**: 3 req/sec enforced by SDK
- **Anthropic API**: Handled by SDK
- **Application**: `MAX_CONCURRENT_RESEARCH` limit

---

## Error Handling

### Strategy

1. **Fail Fast**: Validate inputs early
2. **Retry Transient**: Network errors, rate limits
3. **Log Everything**: Winston for comprehensive logging
4. **Notify User**: Always inform about failures
5. **Graceful Degradation**: Partial data > no data

### Error Categories

```typescript
// Retryable
- Network timeouts
- API rate limits (429)
- Temporary service outages (503)

// Non-retryable
- Invalid API keys (401)
- Missing resources (404)
- Validation errors (400)
```

### Monitoring

```typescript
// Health check endpoint
GET /health
{
  "status": "healthy",
  "uptime": 3600,
  "activeResearchTasks": 2,
  "queueSize": 5
}
```

---

## Future Enhancements

### 1. Advanced Matching

- ML-based similarity scoring
- Historical performance analysis
- Network graph analysis (who invests with whom)

### 2. Additional Data Sources

- AngelList integration
- PitchBook API
- SEC filings analysis
- Twitter/LinkedIn activity tracking

### 3. Automated Outreach

- Email drafting assistance
- Warm intro path finding
- Follow-up scheduling

### 4. Analytics

- Investor response rates
- Best-fit pattern detection
- Fundraising pipeline metrics

### 5. Multi-tenant Support

- Team workspaces
- Role-based access
- Usage quotas

---

## Performance Benchmarks

### Typical Operations

| Operation | Time | Notes |
|-----------|------|-------|
| Research single investor | 10-30s | Includes AI + enrichment |
| Find 10 matching investors | 20-40s | AI matching only |
| Add to Notion | 1-2s | Per investor |
| Web scraping | 2-5s | Per website |
| Crunchbase lookup | 1-3s | If API key provided |

### Bottlenecks

1. **AI Research**: Claude API latency (10-20s)
2. **Web Scraping**: Network + parsing (2-5s)
3. **Notion API**: Rate limits (3 req/sec)

### Optimization Opportunities

- Parallel enrichment requests
- Cached investor data
- Batch Notion operations
- Streaming AI responses

---

**Last Updated:** 2024-01-24
