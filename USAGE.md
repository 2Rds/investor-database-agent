# Usage Guide

How to use the Investor Database Agent to find and manage investor leads.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Commands & Features](#commands--features)
3. [Workflows](#workflows)
4. [Best Practices](#best-practices)
5. [Examples](#examples)

---

## Getting Started

### Initial Setup

1. **Set your startup profile** (recommended first step)
   ```
   @InvestorAgent set profile
   ```
   This helps the AI find better matches for your specific startup.

2. **Invite the bot to your channel**
   ```
   /invite @InvestorAgent
   ```

3. **Get help anytime**
   ```
   @InvestorAgent help
   ```

---

## Commands & Features

### 1. Add Specific Investors

Research and add a known investor/firm to your database.

**Natural Language:**
```
@InvestorAgent add Sequoia Capital
@InvestorAgent research a16z
@InvestorAgent tell me about Benchmark Capital
```

**What happens:**
1. AI researches the investor using Claude
2. Extracts investment thesis, recent investments, focus areas
3. Enriches data from web sources and APIs
4. Shows you a preview
5. Adds to your Notion database
6. Sends confirmation with key details

**Information gathered:**
- Investment thesis and focus areas
- Recent portfolio investments
- Industry and sector preferences
- Funding stage preferences
- Check size ranges
- Geographic focus
- Contact information (website, LinkedIn, email)

---

### 2. Find Matching Investors

Automatically discover investors that match your startup profile.

**Natural Language:**
```
@InvestorAgent find investors for my SaaS startup
@InvestorAgent find me seed stage investors in fintech
@InvestorAgent show me VCs that invest in AI companies
```

**What happens:**
1. Uses your startup profile (or searches based on description)
2. AI identifies 10+ matching investors
3. Calculates match scores (0-100)
4. Provides match reasoning
5. Adds all to your Notion database
6. Shows top matches with explanations

**Match scoring based on:**
- Industry alignment (30 points)
- Stage alignment (25 points)
- Geography match (15 points)
- Check size fit (20 points)
- Recent activity (10 points)

---

### 3. Manage Startup Profile

Set or update your startup profile for better investor matching.

```
@InvestorAgent set profile
@InvestorAgent update my profile
```

**Profile includes:**
- Company name
- Industry/sector
- Current stage (pre-seed, seed, Series A, etc.)
- Description and value proposition
- Funding goal
- Geographic location
- Specific investor traits you're looking for

---

### 4. List Investors

View all investors in your database.

```
@InvestorAgent list investors
@InvestorAgent show my database
/vc-list
```

Shows up to 20 recent investors with a link to view all in Notion.

---

### 5. Get Help

```
@InvestorAgent help
/vc-help
```

---

## Workflows

### Workflow 1: Building Your Initial List

**Goal:** Create a database of 20-30 target investors

1. **Add your top targets** (investors you already know about)
   ```
   @InvestorAgent add Sequoia Capital
   @InvestorAgent add a16z
   @InvestorAgent add First Round Capital
   ```

2. **Find similar investors**
   ```
   @InvestorAgent find more investors like the ones in my database
   ```

3. **Review and refine** in Notion
   - Sort by match score
   - Review match reasons
   - Add personal notes

---

### Workflow 2: Targeted Search

**Goal:** Find investors in a specific niche

1. **Set your profile with specific criteria**
   ```
   @InvestorAgent set profile
   ```

2. **Request targeted search**
   ```
   @InvestorAgent find investors who focus on early-stage B2B SaaS in the US
   ```

3. **Review results**
   - Check match scores
   - Read investment theses
   - Research recent investments

4. **Add notes** in Notion for follow-up

---

### Workflow 3: Research Before Meetings

**Goal:** Deep dive on specific investors before pitching

1. **Add investor to database**
   ```
   @InvestorAgent research [Investor Name]
   ```

2. **Review in Notion:**
   - Investment thesis
   - Recent portfolio companies
   - Industries and stages
   - Check sizes

3. **Customize your pitch** based on:
   - Their thesis alignment
   - Similar portfolio companies
   - Investment preferences

---

### Workflow 4: Ongoing Discovery

**Goal:** Continuously build your investor pipeline

**Weekly routine:**

```
Monday: @InvestorAgent find 5 new investors in [your sector]
Wednesday: Review and add notes in Notion
Friday: Research 2-3 top matches in detail
```

---

## Best Practices

### 1. Start Specific, Go Broad

- Begin with known, high-fit investors
- Use their profiles to find similar investors
- Gradually expand to adjacent sectors/stages

### 2. Quality Over Quantity

- Focus on high match scores (80+)
- Read the match reasoning carefully
- Verify alignment with recent investments

### 3. Use Notion as Your CRM

- Add meeting dates and notes
- Track email conversations
- Update investor status (contacted, meeting set, passed, interested)
- Link to pitch decks and email threads

### 4. Enrich Over Time

- Add personal notes after research
- Update contact information as you find it
- Add relationships and warm intro paths
- Track referrals and connections

### 5. Batch Operations

- Research 5-10 investors at once
- The agent handles concurrency automatically
- Avoid overwhelming yourself with too many at once

### 6. Verify Information

- AI research is accurate but not perfect
- Cross-check critical information
- Visit investor websites to verify thesis
- Check LinkedIn for current roles

---

## Examples

### Example 1: Fintech Startup

**Scenario:** Seed-stage fintech company raising $2M

```
Founder: @InvestorAgent set profile
Bot: [Profile setup flow]

Founder: @InvestorAgent find seed stage fintech investors who write $1-3M checks

Bot: 🔍 Searching for investors matching your criteria...
     📊 Found 10 potential matches. Adding to database...
     ✅ Successfully added 10 investors!

     Top matches:
     1. Nyca Partners (95% match)
        Focus on fintech infrastructure, recently invested in similar seed-stage companies

     2. QED Investors (92% match)
        Active seed investor in financial services, check sizes align perfectly

     [...]
```

### Example 2: B2B SaaS Startup

**Scenario:** Series A SaaS company in sales tech

```
Founder: @InvestorAgent add Bessemer Venture Partners

Bot: 🔍 Researching Bessemer Venture Partners...
     📊 Found information. Enriching data...
     💾 Adding to Notion database...
     ✅ Successfully added Bessemer Venture Partners!

     📍 Industries: Enterprise SaaS, Cloud Infrastructure
     🎯 Stages: Seed, Series A, Series B
     🌍 Geography: US, Europe

Founder: @InvestorAgent find more investors like Bessemer

Bot: [Finds similar SaaS-focused VCs...]
```

### Example 3: Hardware Startup

**Scenario:** Deep tech hardware company

```
Founder: @InvestorAgent find investors who focus on hardware and deep tech

Bot: 🔍 Searching for matching investors...

     Found specialists:
     - Lux Capital (hardware/deep tech focus)
     - DCVC (data-driven hardware)
     - Root Ventures (technical founders)
     [...]
```

---

## Tips & Tricks

### Natural Language Understanding

The bot understands various phrasings:

✅ "add Sequoia Capital"
✅ "research a16z for me"
✅ "tell me about Benchmark"
✅ "find VCs in fintech"
✅ "show me seed investors"

### Threading

All responses are threaded, so you can:
- Have multiple conversations simultaneously
- Keep research organized by investor/topic
- Review conversation history easily

### Notifications

You'll get real-time updates:
- When research starts
- During enrichment process
- When added to database
- Upon completion or errors

### Batch Processing

Queue multiple requests:

```
@InvestorAgent add Sequoia Capital
@InvestorAgent add a16z
@InvestorAgent add Benchmark
```

The agent processes them concurrently (up to 3 at once by default).

---

## Troubleshooting

**Bot not finding good matches?**
- Refine your startup profile
- Be more specific in your search criteria
- Try adding a few target investors manually first

**Information seems outdated?**
- Investment data may be delayed
- Check the "Last Updated" field in Notion
- Verify on investor websites

**Missing contact information?**
- Not all data is publicly available
- Try searching LinkedIn separately
- Use Crunchbase API for better enrichment

**Too many/too few results?**
- Adjust match score threshold
- Narrow or broaden search criteria
- Use more specific stage/industry filters

---

## Next Steps

1. Start building your list with 5-10 known targets
2. Use AI matching to expand to 30-50 prospects
3. Prioritize by match score and fit
4. Research top matches deeply
5. Begin outreach to highest-fit investors

Happy fundraising! 🚀
