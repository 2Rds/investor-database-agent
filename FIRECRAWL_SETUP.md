# Firecrawl Setup Guide

## 🔥 Free Firecrawl API via Lovable Promo

**IMPORTANT:** Lovable is offering **100% free Firecrawl API access until January 26, 2025**. This gives you unlimited web scraping for investor enrichment at zero cost during your seed round outreach campaign!

---

## What is Firecrawl?

Firecrawl is an AI-powered web scraping API that provides:
- ✅ JavaScript rendering (bypasses SPAs)
- ✅ Anti-bot detection bypass
- ✅ Clean markdown output
- ✅ Automatic content extraction
- ✅ Structured data parsing
- ✅ **10x more reliable than Cheerio/Axios**

Perfect for scraping investor websites to extract:
- Investment thesis
- Portfolio companies
- Focus areas (blockchain, infrastructure, etc.)
- Check sizes
- Geographic preferences
- Recent deals

---

## How to Get Your Free Firecrawl API Key

### Option 1: Via Lovable Dashboard (Recommended)

1. **Log in to Lovable**
   - Go to https://lovable.dev/
   - Sign in with your account

2. **Access your AI-OS project**
   - Navigate to: https://lovable.dev/projects/5e8e08f2-a80a-432c-99b5-b08c50f6b968
   - This is your Block IQ / AI-OS project

3. **Find Firecrawl Integration**
   - Click on "Integrations" or "Settings"
   - Look for "Firecrawl" in the list of integrations
   - Click "Enable" or "Get API Key"

4. **Copy Your API Key**
   - Your Firecrawl API key will start with `fc-`
   - Example: `fc-1234567890abcdef`
   - Copy this key

### Option 2: Direct from Firecrawl (Requires Lovable Referral)

1. Go to https://firecrawl.dev/
2. Sign up with the same email you use for Lovable
3. Look for "Lovable Promotion" banner
4. Apply the promo code (should be automatic)
5. Copy your API key from the dashboard

---

## Setting Up the Investor Agent

### 1. Add API Key to Environment

```bash
cd /home/user/investor-database-agent

# Copy .env.example to .env (if you haven't already)
cp .env.example .env

# Edit .env and add your Firecrawl API key
nano .env  # or use your preferred editor
```

Add this line to your `.env` file:
```env
FIRECRAWL_API_KEY=fc-your-actual-api-key-here
```

### 2. Verify Configuration

```bash
# Test that Firecrawl is properly configured
npm run enrich-top-matches
```

If you see:
```
❌ Firecrawl API key not configured!
```

Then the API key is missing or incorrect. Double-check your `.env` file.

If you see:
```
🔥 Firecrawl Investor Enrichment
```

You're good to go!

---

## Using Firecrawl for Investor Enrichment

### Step 1: Analyze Your Investor Database

First, run the match scoring analysis:

```bash
npm run analyze-csv
```

This will:
- Score all 2,889 investors in your CSV
- Generate `top-100-matches.csv` with S-Tier and A-Tier investors
- Show you the top 20 perfect matches for BlockDrive

### Step 2: Enrich Top Matches with Firecrawl

Run the enrichment script on your top 100 matches:

```bash
npm run enrich-top-matches
```

This will:
- Read `top-100-matches.csv`
- Scrape each investor's website using Firecrawl
- Extract investment thesis, focus areas, check sizes
- Save enriched data to `top-100-matches-enriched.csv`
- Rate limit to 1 request/second (respectful scraping)

**Example output:**
```
🔥 Firecrawl Investor Enrichment
=================================

📊 Reading top matches from: analysis-results/top-100-matches.csv

✅ Loaded 15 top-tier investors

🌐 Starting Firecrawl enrichment...

[1/15] Bedrock (S-Tier - 100%)
   ✅ Success!
   📝 Thesis: We invest in blockchain infrastructure, enterprise SaaS, and zero-knowledge privacy solutions...
   🏷️  Industries: blockchain, infrastructure, saas, cybersecurity
   🎯 Stages: seed, series_a

[2/15] Blue Bear Capital (S-Tier - 97%)
   ✅ Success!
   📝 Thesis: Early-stage investor in web3, cloud infrastructure, and decentralized systems...
   🏷️  Industries: blockchain, web3, infrastructure, crypto
   🎯 Stages: seed, pre_seed, series_a

...

═══════════════════════════════════════════════════════════
✨ Enrichment Complete!
═══════════════════════════════════════════════════════════
✅ Success: 13
❌ Failed:  0
⏭️  Skipped: 2  (no website)
📊 Total:   15
═══════════════════════════════════════════════════════════

💾 Enriched results saved to: analysis-results/top-100-matches-enriched.csv
```

### Step 3: Review Enriched Data

Open `analysis-results/top-100-matches-enriched.csv` to see:
- All original match data (firm name, email, match score, etc.)
- **NEW:** Investment thesis extracted from website
- **NEW:** Industries detected
- **NEW:** Investment stages
- **NEW:** Check size ranges
- **NEW:** Geographic focus

Use this enriched data to:
1. Personalize your outreach emails
2. Reference specific portfolio companies
3. Align your pitch with their investment thesis
4. Demonstrate you did your research

---

## Enrichment Pipeline Architecture

```
┌─────────────────────────────────────────────────────────┐
│  1. CSV Analysis (BlockDrive Match Scoring)             │
│     • Web3/blockchain focus (30 pts)                    │
│     • Infrastructure (20 pts)                           │
│     • Privacy/security (15 pts)                         │
│     • Seed stage (15 pts)                               │
│     • Check size match (10 pts)                         │
│     Output: top-100-matches.csv                         │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  2. Firecrawl Enrichment                                │
│     • Scrape investor website                           │
│     • Extract investment thesis                         │
│     • Parse focus areas & industries                    │
│     • Identify check sizes & stages                     │
│     • Extract recent portfolio companies                │
│     Output: top-100-matches-enriched.csv                │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  3. Notion Database Sync                                │
│     • Upload enriched investors to Notion               │
│     • Create personalized outreach templates            │
│     • Track outreach status                             │
│     • Monitor responses                                 │
│     Output: Fundraising Tracker dashboard               │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  4. January 1 Launch 🚀                                 │
│     • Begin personalized outreach                       │
│     • Use AI agent as pitch hook                        │
│     • Target: $2.5M @ $18-22M cap                       │
│     • Leverage enriched data for customization          │
└─────────────────────────────────────────────────────────┘
```

---

## Cost Savings

### With Firecrawl (Free via Lovable until Jan 26)

- **Cost:** $0 for 15 top matches
- **Cost:** $0 for 100 matches
- **Cost:** $0 for entire 2,889 database
- **Reliability:** 95%+ success rate
- **Data Quality:** AI-extracted, structured

### Without Firecrawl (Manual Research)

- **Time:** 15 minutes per investor = 25 hours for 100 investors
- **Cost:** $50/hr × 25 hours = $1,250
- **Reliability:** Human error, inconsistent
- **Data Quality:** Unstructured notes

**🎯 Savings: $1,250+ in research time**

---

## Rate Limits & Best Practices

### Current Settings (in enrich-top-matches.ts)

```typescript
// Rate limiting: 1 request per second
await new Promise((resolve) => setTimeout(resolve, 1000));
```

This means:
- **15 investors:** ~15 seconds
- **100 investors:** ~2 minutes
- **2,889 investors:** ~48 minutes

### Recommendations

1. **Start with S-Tier only** (5 investors)
   - Highest quality matches
   - Test your outreach messaging
   - Validate enrichment quality

2. **Expand to A-Tier** (15 total)
   - Strong matches
   - Build initial pipeline

3. **Scale to B-Tier** (67 total)
   - Good matches
   - Broader campaign

4. **Full database enrichment**
   - Only if needed
   - Consider cost after Jan 26

---

## Troubleshooting

### "Firecrawl API key not configured"

**Solution:**
1. Check `.env` file exists: `ls -la .env`
2. Check API key is set: `cat .env | grep FIRECRAWL`
3. Restart terminal/reload environment
4. Verify key starts with `fc-`

### "Firecrawl scrape failed"

**Possible causes:**
- Website is down
- Website blocks scrapers (rare with Firecrawl)
- Rate limit exceeded (should auto-retry)

**Solution:**
- Check website URL is valid
- Verify API key has credits
- Check Firecrawl status: https://status.firecrawl.dev/

### "No website found"

**Solution:**
- CSV has "NA" or empty website fields
- Script automatically skips these
- Manually research or use LinkedIn

---

## Next Steps

1. ✅ Set up Firecrawl API key
2. ✅ Run `npm run analyze-csv` to generate matches
3. ✅ Run `npm run enrich-top-matches` to scrape data
4. ⏳ Review enriched data in CSV
5. ⏳ Sync to Notion database
6. ⏳ Deploy to Railway
7. 🚀 Launch outreach January 1

---

## Free Promo Deadline

⏰ **Lovable's free Firecrawl promo ends January 26, 2025**

**Timeline:**
- ✅ December 25: Set up Firecrawl
- ✅ December 26-31: Enrich all top matches
- 🚀 January 1-15: Primary outreach campaign
- 📊 January 16-26: Follow-ups and second wave
- ⚠️ January 27+: May need to upgrade or find alternative

**Pro tip:** Enrich your entire database (2,889 investors) before January 26 to have comprehensive data for future campaigns at zero cost!

---

## Questions?

Check the official docs:
- Firecrawl: https://docs.firecrawl.dev/
- Lovable: https://docs.lovable.dev/

Or review the code:
- Firecrawl service: `src/services/research/firecrawl-enrichment.ts`
- Enrichment script: `src/scripts/enrich-top-matches.ts`
