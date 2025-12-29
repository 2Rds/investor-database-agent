# Notion Database Match Scoring Guide

## Overview

This script connects to your Notion VC lead database and applies the BlockDrive-specific match scoring algorithm to every investor, updating their match scores, tiers, and detailed breakdowns directly in Notion.

## 🎯 What It Does

1. **Fetches** all investors from your Notion database (with pagination support)
2. **Scores** each investor using the BlockDrive algorithm (100-point system)
3. **Updates** Notion with:
   - # Match (0-100 score)
   - Tier (S-Tier, A-Tier, B-Tier, C-Tier, Not a Match)
   - Match Detail (detailed breakdown of scoring)
   - Enriched checkbox (marked as true)

## 📋 Prerequisites

### 1. Notion Database Setup

Your Notion database needs these properties:

#### Required Properties (Already in your database):
- ✅ **Name** (Title) - Investor/firm name
- ✅ **Description** (Rich Text) - Firm description/investment thesis
- ✅ **Partner Name** (Rich Text) - Partner/contact name
- ✅ **Partner Email** (Email) - Contact email
- ✅ **Portfolio** (URL) - Website/portfolio URL
- ✅ **Firm LinkedIn** (URL) - LinkedIn profile
- ✅ **Average Check Size** (Number) - Average investment size
- ✅ **# Match** (Number) - Match score percentage
- ✅ **Enriched** (Checkbox) - Whether data is enriched

#### Required Properties (User Added):
- ✅ **Tier** (Select) - Match tier classification
  - Options: S-Tier, A-Tier, B-Tier, C-Tier, Not a Match
- ✅ **Match Detail** (Rich Text) - Detailed scoring breakdown

### 2. Environment Variables

Ensure these are set in your `.env` file:

```env
NOTION_API_KEY=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
NOTION_DATABASE_ID=2d4b9057154980e09b80f3cd5ac2123c
```

## 🚀 Usage

### Run the Scoring Script

```bash
npm run score-notion
```

### What You'll See

```
🎯 BlockDrive Investor Match Scoring - Notion Edition

============================================================

📥 Fetching all investors from Notion database...

  Fetched 100 investors so far...
  Fetched 200 investors so far...

✅ Fetched 250 total investors

📊 Scoring investors with BlockDrive algorithm...

🌟 Bedrock Capital                           100% (S-Tier)
⭐ Blue Bear Capital                         97% (A-Tier)
🌟 Rubicon VC                                95% (S-Tier)
📌 Standard Crypto                           68% (B-Tier)
...

============================================================

📈 Match Score Distribution:

🌟 S-Tier (90-100%):  5 investors
⭐ A-Tier (75-89%):   10 investors
📌 B-Tier (50-74%):   35 investors
📎 C-Tier (25-49%):   80 investors
❌ Not a Match (<25%): 120 investors

============================================================

💾 Updating Notion database with match scores...

  ✅ Updated 10/250 investors...
  ✅ Updated 20/250 investors...
  ...

============================================================

✅ Scoring Complete!

Total Investors: 250
Successfully Updated: 250
Failed: 0

============================================================

🏆 Top 10 Matches for BlockDrive:

1. Bedrock Capital
   Match: 100% (S-Tier)
   Reason: Perfect fit for BlockDrive: blockchain infrastructure with strong privacy/security focus

2. Blue Bear Capital
   Match: 97% (A-Tier)
   Reason: Excellent match: web3 infrastructure investor with cybersecurity expertise

...

🎉 All match scores have been updated in your Notion database!
📌 Check the "# Match", "Tier", and "Match Detail" columns
```

## 📊 Match Scoring Algorithm

### Scoring Criteria (100 points max):

1. **Web3/Blockchain Focus (30 pts)**
   - Keywords: Solana, blockchain, crypto, web3, DeFi, NFT, dApp, smart contracts
   - BlockDrive is a Solana-based Web3 infrastructure project

2. **Infrastructure Investments (20 pts)**
   - Keywords: cloud, storage, infrastructure, SaaS, enterprise, B2B, developer tools
   - BlockDrive provides cloud storage infrastructure

3. **Privacy/Security Focus (15 pts)**
   - Keywords: cybersecurity, privacy, zero-knowledge, encryption, data protection
   - BlockDrive's core IP is zero-knowledge security

4. **Seed Stage Active (15 pts)**
   - Keywords: seed, pre-seed, early-stage, series A
   - BlockDrive is raising a $2.5M seed round

5. **Check Size Match (10 pts)**
   - Target: $500K-$5M check size
   - BlockDrive has $1M @ $18M, $1M @ $20M, $500K @ $22M SAFE structure

6. **Recent Activity (10 pts)**
   - Keywords: recent, 2024, 2025, active, latest
   - Indicates investor is currently active

### Tier Definitions:

- **S-Tier (90-100%)**: Perfect fit, priority outreach
- **A-Tier (75-89%)**: Excellent match, high priority
- **B-Tier (50-74%)**: Good match, medium priority
- **C-Tier (25-49%)**: Potential match, low priority
- **Not a Match (<25%)**: Poor fit, deprioritize

## 📈 What Gets Updated in Notion

### Example Updated Record:

**Firm Name:** Bedrock Capital

**# Match:** 100

**Tier:** S-Tier

**Match Detail:**
```
Perfect fit for BlockDrive: blockchain infrastructure with strong privacy/security focus

Breakdown:
• Web3/Blockchain: 30/30
• Infrastructure: 20/20
• Privacy/Security: 15/15
• Seed Stage: 15/15
• Check Size: 10/10
• Recent Activity: 10/10
```

**Enriched:** ✓

## 🎯 Next Steps After Scoring

1. **Filter by S-Tier**
   - In Notion, filter by `Tier = S-Tier`
   - These are your top priority targets (90-100% match)

2. **Sort by # Match**
   - Sort descending to see best matches first
   - Focus on 75+ for initial outreach

3. **Review Match Detail**
   - Read the detailed breakdown for each top match
   - Understand WHY they're a good fit for personalized outreach

4. **Update Status**
   - Mark investors as "Contacted" when you reach out
   - Track progression through fundraising pipeline

5. **Export Top Matches**
   - Export S-Tier and A-Tier investors to CSV
   - Use for mail merge, personalized outreach campaigns

## ⚙️ Technical Details

### Data Mapping

The script maps Notion properties to the scoring format:

| Notion Property | Scoring Field |
|----------------|---------------|
| Name | firmName |
| Description | investmentFocus, firmDescription |
| Partner Name | firstName, lastName |
| Partner Email | email |
| Portfolio | website |
| Firm LinkedIn | linkedInProfile |
| Average Check Size | avgCheckSize |

### Rate Limiting

- Script includes automatic rate limiting (350ms between requests)
- Notion API limit: 3 requests/second
- For 250 investors: ~90 seconds total runtime

### Error Handling

- Continues on individual failures
- Shows success/failure count at the end
- Logs detailed errors for debugging

## 🔧 Troubleshooting

### Error: "Notion database not accessible"
- Check `NOTION_DATABASE_ID` in `.env`
- Verify Notion integration has access to database
- Ensure API key is valid

### Error: "Property 'Tier' does not exist"
- Add the "Tier" select property to your Notion database
- Ensure it has options: S-Tier, A-Tier, B-Tier, C-Tier, Not a Match

### Error: "Rate limit exceeded"
- Script already includes rate limiting
- If still occurring, increase delay in code (line with `setTimeout`)

### No investors found
- Check database ID is correct
- Verify database has investor records
- Test with `npm run dev` to see detailed logs

## 💡 Pro Tips

1. **Run Regularly**: Re-score after adding new investors or updating descriptions
2. **Customize Scoring**: Adjust weights in `blockdrive-scorer.ts` for your specific needs
3. **Combine with CSV**: Use both CSV scoring and Notion scoring for comprehensive analysis
4. **Export Results**: Export scored Notion database to CSV for backup/analysis
5. **Filter Views**: Create Notion views filtered by tier for efficient workflow

## 🎉 Ready to Score!

```bash
npm run score-notion
```

Your entire Notion VC database will be scored and updated with BlockDrive match intelligence in under 2 minutes!
