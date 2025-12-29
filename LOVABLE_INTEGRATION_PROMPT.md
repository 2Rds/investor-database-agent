# Lovable Integration Prompt

Copy the text below and paste it into Lovable to integrate the BlockDrive scoring API with your investor-compass app.

---

## Prompt for Lovable:

I need to integrate the BlockDrive investor scoring API into my investor-compass app. Please create the following:

### 1. Create Supabase Edge Function: `blockdrive-score`

Create a new edge function at `supabase/functions/blockdrive-score/index.ts` with this code:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const SCORING_API_URL = Deno.env.get('BLOCKDRIVE_SCORING_API_URL') || 'http://localhost:3000/api/score-investor'

interface InvestorScoreRequest {
  firmName: string
  investorType?: string
  investmentFocus?: string
  stage?: string
  avgCheckSize?: string
  totalInvestments?: string
  preferredGeography?: string
  firmDescription?: string
  additionalNotes?: string
  firstName?: string
  lastName?: string
  email?: string
  website?: string
  linkedInProfile?: string
  totalExits?: string
}

interface ScoreBreakdown {
  web3Blockchain: number
  infrastructure: number
  privacySecurity: number
  seedStageActive: number
  checkSizeMatch: number
  recentActivity: number
}

interface ScoreResponse {
  success: boolean
  investor: {
    firmName: string
  }
  score: {
    tier: 'S-Tier' | 'A-Tier' | 'B-Tier' | 'C-Tier' | 'Not a Match'
    percentageMatch: number
    totalScore: number
    maxScore: number
    matchReason: string
    breakdown: ScoreBreakdown
  }
  addToNotion: boolean
}

serve(async (req) => {
  // CORS headers
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  }

  try {
    const investorData: InvestorScoreRequest = await req.json()

    // Validate required field
    if (!investorData.firmName) {
      return new Response(
        JSON.stringify({ success: false, error: 'firmName is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        }
      )
    }

    // Call BlockDrive Scoring API
    const response = await fetch(SCORING_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(investorData),
    })

    if (!response.ok) {
      throw new Error(`Scoring API returned ${response.status}`)
    }

    const scoreResult: ScoreResponse = await response.json()

    return new Response(JSON.stringify(scoreResult), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error) {
    console.error('Error calling BlockDrive scoring API:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }
    )
  }
})
```

### 2. Update the Investor Type Definitions

In `src/types/investor.ts`, ensure the tier values match the BlockDrive API:

**CRITICAL: Update tier thresholds to match BlockDrive scoring (60/70/80/90):**

```typescript
export type InvestorTier = 'S-Tier' | 'A-Tier' | 'B-Tier' | 'C-Tier' | 'Not a Match'

export interface InvestorScoreBreakdown {
  web3Blockchain: number      // Max 30 points
  infrastructure: number      // Max 20 points
  privacySecurity: number     // Max 15 points
  seedStageActive: number     // Max 15 points
  checkSizeMatch: number      // Max 10 points
  recentActivity: number      // Max 10 points
}

export interface InvestorMatchScore {
  tier: InvestorTier
  percentageMatch: number
  breakdown: InvestorScoreBreakdown
}

// Tier thresholds (MUST match BlockDrive API):
// S-Tier: 90-100% - Perfect fit, immediate priority
// A-Tier: 80-89% - Strong fit, high priority
// B-Tier: 70-79% - Good fit, solid candidate
// C-Tier: 60-69% - Viable fit, broader campaign
// Not a Match: <60% - Not viable, skip
```

### 3. Update CSV Import to Call Scoring API

In `src/components/investors/CSVImportDialog.tsx`, update the import handler to:

1. Parse CSV data
2. For each investor, call the `blockdrive-score` edge function
3. Only add investors with score >= 60% (C-Tier and above)
4. Display tier and score in the UI

**Example integration in the import handler:**

```typescript
const scoreInvestor = async (investorData: any) => {
  const { data, error } = await supabase.functions.invoke('blockdrive-score', {
    body: {
      firmName: investorData.firmName,
      investmentFocus: investorData.investmentFocus,
      stage: investorData.stage,
      avgCheckSize: investorData.avgCheckSize,
      // ... map other CSV fields
    }
  })

  if (error) throw error
  return data
}

// In the import logic:
const qualifiedInvestors = []

for (const investor of parsedInvestors) {
  const scoreResult = await scoreInvestor(investor)

  // Only add investors with >= 60% match (C-Tier and above)
  if (scoreResult.addToNotion && scoreResult.score.percentageMatch >= 60) {
    qualifiedInvestors.push({
      ...investor,
      matchScore: {
        tier: scoreResult.score.tier,
        percentageMatch: scoreResult.score.percentageMatch,
        breakdown: scoreResult.score.breakdown
      }
    })
  }
}

// Show toast with results
toast.success(`Imported ${qualifiedInvestors.length} qualified investors (≥60% match)`)
toast.info(`Filtered out ${parsedInvestors.length - qualifiedInvestors.length} low-match investors (<60%)`)
```

### 4. Update the Investors Page Display

In `src/pages/Investors.tsx`, update the tier counting logic to match the new thresholds:

```typescript
const calculateMetrics = () => {
  const tierCounts = {
    'S-Tier': investors.filter(i => i.matchScore.percentageMatch >= 90).length,
    'A-Tier': investors.filter(i => i.matchScore.percentageMatch >= 80 && i.matchScore.percentageMatch < 90).length,
    'B-Tier': investors.filter(i => i.matchScore.percentageMatch >= 70 && i.matchScore.percentageMatch < 80).length,
    'C-Tier': investors.filter(i => i.matchScore.percentageMatch >= 60 && i.matchScore.percentageMatch < 70).length,
    'Not a Match': investors.filter(i => i.matchScore.percentageMatch < 60).length,
  }

  return tierCounts
}
```

### 5. Environment Variable Setup

Add this environment variable to your Supabase project settings:

```
BLOCKDRIVE_SCORING_API_URL=https://your-deployed-api.railway.app/api/score-investor
```

**For local development:**
```
BLOCKDRIVE_SCORING_API_URL=http://localhost:3000/api/score-investor
```

### 6. Update Mock Data (Optional)

If you have mock data in `src/data/mockInvestors.ts`, update it to use the new tier thresholds (60/70/80/90).

---

## Summary of Changes:

✅ **New edge function**: `supabase/functions/blockdrive-score/index.ts`
✅ **Updated tier thresholds**: 60% (C), 70% (B), 80% (A), 90% (S)
✅ **Filter logic**: Only import investors with ≥60% match
✅ **Type definitions**: Match BlockDrive API response structure
✅ **Environment variable**: BLOCKDRIVE_SCORING_API_URL

---

## Testing:

After implementing, test by:

1. Importing a CSV with various investors
2. Verify only investors with ≥60% scores are added
3. Check that tier badges display correctly (S/A/B/C)
4. Verify score breakdowns show in ScoreBreakdownChart

---

## Important Notes:

- **Minimum viable score is 60%** - anything below is filtered out
- **Tier thresholds MUST match** the BlockDrive API (60/70/80/90)
- The scoring API is your secret sauce - keep it separate and reusable
- Use Lovable's native Notion integration to sync qualified investors to Notion

Please implement all these changes and ensure the tier thresholds are consistent throughout the codebase.
