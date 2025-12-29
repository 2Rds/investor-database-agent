# BlockDrive Scoring API Documentation

REST API for scoring investors using the BlockDrive algorithm.

## Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Run API server
npm run api

# Run with auto-reload
npm run api:dev
```

The API will start on `http://localhost:3000`

## Endpoints

### 1. Health Check

**GET** `/api/health`

Check if the API is running.

**Response:**
```json
{
  "status": "healthy",
  "service": "BlockDrive Scoring API",
  "version": "1.0.0",
  "timestamp": "2025-12-29T20:00:00.000Z"
}
```

---

### 2. Score Single Investor

**POST** `/api/score-investor`

Score a single investor using the BlockDrive algorithm.

**Request Body:**
```json
{
  "firmName": "Sequoia Capital",
  "investorType": "Venture Capital",
  "investmentFocus": "web3, blockchain, infrastructure, enterprise software",
  "stage": "seed, series a",
  "avgCheckSize": "$1M-$5M",
  "totalInvestments": "150",
  "preferredGeography": "San Francisco, New York",
  "firmDescription": "Leading VC firm focused on blockchain infrastructure",
  "additionalNotes": "Strong track record in crypto investments"
}
```

**Response:**
```json
{
  "success": true,
  "investor": {
    "firmName": "Sequoia Capital"
  },
  "score": {
    "tier": "A-Tier",
    "percentageMatch": 85,
    "totalScore": 85,
    "maxScore": 100,
    "matchReason": "Strong web3 focus • Infrastructure investor • Active seed-stage investor",
    "breakdown": {
      "web3Blockchain": 30,
      "infrastructure": 20,
      "privacySecurity": 10,
      "seedStageActive": 15,
      "checkSizeMatch": 10,
      "recentActivity": 0
    }
  },
  "addToNotion": true
}
```

**Field Requirements:**
- `firmName`: Required - Name of the investment firm
- All other fields: Optional but improve scoring accuracy

---

### 3. Batch Score Investors

**POST** `/api/batch-score`

Score multiple investors in a single request.

**Request Body:**
```json
{
  "investors": [
    {
      "firmName": "a16z crypto",
      "investmentFocus": "blockchain, web3, crypto",
      "stage": "seed",
      "avgCheckSize": "$2M-$5M"
    },
    {
      "firmName": "Greylock",
      "investmentFocus": "enterprise, saas, infrastructure",
      "stage": "series a",
      "avgCheckSize": "$5M-$10M"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "results": [
    {
      "firmName": "a16z crypto",
      "tier": "S-Tier",
      "percentageMatch": 95,
      "addToNotion": true,
      "score": {
        "totalScore": 95,
        "maxScore": 100,
        "matchReason": "Perfect web3 fit • Active seed investor",
        "breakdown": { ... }
      }
    },
    {
      "firmName": "Greylock",
      "tier": "B-Tier",
      "percentageMatch": 70,
      "addToNotion": true,
      "score": { ... }
    }
  ],
  "summary": {
    "total": 2,
    "qualified": 2,
    "tierCounts": {
      "S-Tier": 1,
      "A-Tier": 0,
      "B-Tier": 1,
      "C-Tier": 0,
      "Not a Match": 0
    }
  }
}
```

---

### 4. Get Scoring Criteria

**GET** `/api/scoring-criteria`

Returns the BlockDrive scoring criteria and tier definitions.

**Response:**
```json
{
  "success": true,
  "criteria": {
    "web3Blockchain": {
      "maxPoints": 30,
      "description": "Web3/Blockchain Focus - Solana, blockchain, crypto, web3, DeFi"
    },
    "infrastructure": {
      "maxPoints": 20,
      "description": "Infrastructure Investments - Cloud, storage, infrastructure, SaaS, enterprise"
    },
    "privacySecurity": {
      "maxPoints": 15,
      "description": "Privacy/Security Focus - Cybersecurity, privacy, zero-knowledge, encryption"
    },
    "seedStageActive": {
      "maxPoints": 15,
      "description": "Seed Stage Active - Explicitly invests in seed/pre-seed"
    },
    "checkSizeMatch": {
      "maxPoints": 10,
      "description": "Check Size Match - $500K-$5M range"
    },
    "recentActivity": {
      "maxPoints": 10,
      "description": "Recent Activity - Based on total investments as proxy"
    }
  },
  "tiers": {
    "S-Tier": {
      "range": "90-100%",
      "description": "Perfect fit, immediate priority outreach"
    },
    "A-Tier": {
      "range": "80-89%",
      "description": "Strong fit, high priority outreach"
    },
    "B-Tier": {
      "range": "70-79%",
      "description": "Good fit, solid candidate for outreach"
    },
    "C-Tier": {
      "range": "60-69%",
      "description": "Viable fit, consider for broader campaign"
    },
    "Not a Match": {
      "range": "<60%",
      "description": "Not viable, skip"
    }
  },
  "minimumViableScore": 60
}
```

---

## Scoring Algorithm

### Criteria Breakdown (100 points total)

| Criterion | Points | Description |
|-----------|--------|-------------|
| **Web3/Blockchain** | 30 | Focus on blockchain, crypto, web3, DeFi, Solana |
| **Infrastructure** | 20 | Cloud, storage, enterprise SaaS investments |
| **Privacy/Security** | 15 | Cybersecurity, privacy, zero-knowledge |
| **Seed Stage** | 15 | Active seed/pre-seed investor |
| **Check Size** | 10 | $500K-$5M range match |
| **Recent Activity** | 10 | Portfolio size as proxy for activity |

### Tier Classification

- **S-Tier (90-100%)**: Perfect fit - immediate priority
- **A-Tier (80-89%)**: Strong fit - high priority
- **B-Tier (70-79%)**: Good fit - solid candidate
- **C-Tier (60-69%)**: Viable fit - broader campaign
- **Not a Match (<60%)**: Not viable - skip

### Minimum Viable Score

**60%** - Only investors scoring 60% or higher (C-Tier and above) should be added to your database. These represent viable fundraising targets.

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "firmName is required"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Internal server error",
  "message": "Error details..."
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Endpoint not found",
  "path": "/api/invalid"
}
```

---

## CORS

The API allows cross-origin requests from all origins. In production, this should be restricted to your Lovable app domain.

---

## Rate Limiting

Currently no rate limiting is enforced. Consider adding rate limiting in production deployment.

---

## Deployment

### Railway

1. Connect GitHub repo
2. Set environment variables (if needed)
3. Deploy from `main` branch
4. Railway will auto-detect Node.js and install dependencies

### Vercel

1. Import GitHub repo
2. Set build command: `npm run build`
3. Set start command: `npm run api`
4. Deploy

### Docker

```dockerfile
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "run", "api"]
```

---

## Example Usage from Lovable App

```typescript
// Supabase Edge Function example
const response = await fetch('https://your-api.railway.app/api/score-investor', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    firmName: investor.firmName,
    investmentFocus: investor.investmentFocus,
    stage: investor.stage,
    // ... other fields
  })
});

const result = await response.json();

if (result.addToNotion) {
  // Investor scored >= 60%, add to Notion
  console.log(`${result.investor.firmName} is ${result.score.tier}`);
}
```
