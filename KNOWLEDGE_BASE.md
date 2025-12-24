# Knowledge Base & Learning Features

The Investor Database Agent includes powerful knowledge management capabilities that help it learn about your startup to provide increasingly accurate investor matches.

## Table of Contents

1. [Overview](#overview)
2. [Knowledge Base Features](#knowledge-base-features)
3. [Interactive Learning](#interactive-learning)
4. [Setup](#setup)
5. [Usage Guide](#usage-guide)
6. [Best Practices](#best-practices)

---

## Overview

The knowledge base system allows the agent to:
- **Store** information about your startup from multiple sources
- **Learn** through interactive conversations
- **Understand** your startup better over time
- **Optimize** investor matching based on deep contextual knowledge

The more information you provide, the better the agent can match you with investors that truly align with your startup.

---

## Knowledge Base Features

### `/vc-knowledge` Command

Add information about your startup in various formats:

**Supported Content Types:**
- 📎 **Links**: Website URLs, pitch decks, blog posts, press releases
- 📝 **Text**: Quick updates, traction metrics, team info
- 🖼️ **Images**: Screenshots, charts, product photos, pitch deck slides
- 📄 **Documents**: PDFs, Google Docs links
- 🎥 **Videos**: Pitch videos, product demos, Loom recordings

**How It Works:**
1. Submit content via `/vc-knowledge [content]`
2. Agent processes and analyzes the content using AI
3. Extracts key information and insights
4. Categorizes and tags automatically
5. Stores in Notion knowledge database
6. Uses context for better investor matching

**Automatic Processing:**
- **Summarization**: Long documents summarized intelligently
- **Tag Extraction**: Relevant tags automatically identified
- **Categorization**: Sorted into Product, Team, Traction, Market, Funding, Strategy
- **Insight Mining**: Key facts extracted for quick reference

### `/vc-knowledge-summary` Command

View what the agent knows about your startup:

```
/vc-knowledge-summary
```

**Shows:**
- Total knowledge items by type
- Startup profile summary
- Key insights captured
- Recent updates

---

## Interactive Learning

### `/vc-learn` Command

Start an intelligent Q&A session where the agent asks you questions.

**How It Works:**
1. Agent analyzes current knowledge gaps
2. Generates intelligent questions tailored to your situation
3. Asks up to 10 questions covering critical areas
4. Extracts insights from your answers
5. Stores learnings in knowledge base
6. Provides summary report at completion

**Question Focus Areas:**
- Problem being solved and target customer
- Unique value proposition
- Market size and opportunity
- Current traction (revenue, users, growth)
- Team background and expertise
- Funding history and current raise
- Go-to-market strategy
- Vision and long-term goals
- Key challenges

**Example Session:**

```
You: /vc-learn

Agent: 🎓 Starting Interactive Learning Session

I'll ask you some questions to better understand your startup and optimize
investor matching. You can stop anytime by typing "stop" or using /vc-learn-stop.

Question 1/10:

What specific problem does your startup solve, and who is your primary target customer?

You: We help B2B SaaS companies reduce churn by 30% through AI-powered customer health scoring...

Agent: Thanks! That's very helpful.

Question 2/10:

What's your current monthly recurring revenue (MRR) and growth rate over the past 3 months?

You: We're at $50k MRR with 25% month-over-month growth...

[Session continues...]

Agent: ✅ Learning session complete!

📚 Learning Session Summary:
- Questions Asked: 10
- Insights Gathered: 15

Key Insights:
1. B2B SaaS focused on churn reduction
2. $50k MRR with 25% MoM growth
3. Targeting seed funding of $2M
...

I now have a much better understanding of your startup and can provide
more accurate investor matches! 🎯
```

### `/vc-learn-stop` Command

End the current learning session early:

```
/vc-learn-stop
```

The agent will provide a summary of insights gathered so far.

---

## Setup

### 1. Create Notion Knowledge Database (Optional)

If you want persistent knowledge storage in Notion:

1. Create a new database in Notion
2. Name it "Startup Knowledge Base"
3. Add these properties:

| Property | Type | Description |
|----------|------|-------------|
| Title | Title | Knowledge item title |
| Type | Select | File, Link, Text, Image, Video, Document |
| User ID | Text | User identifier |
| Content | Text | Main content/description |
| URL | URL | Link to resource |
| Summary | Text | AI-generated summary |
| Tags | Multi-select | Relevant tags |
| Category | Select | Product, Team, Traction, Market, Funding, Strategy, Other |
| Added At | Date | When item was added |
| Source | Select | User Upload, Slack Message, Conversation |

4. Share with your Notion integration
5. Copy the database ID
6. Add to `.env`:

```env
NOTION_KNOWLEDGE_DATABASE_ID=your-knowledge-database-id
```

**Note:** If you don't set up a Notion knowledge database, the agent will store knowledge in memory (lost on restart).

### 2. Grant Slack Permissions

Ensure your Slack app has these additional permissions:
- `files:read` - To process uploaded files
- `files:write` - To store processed content

---

## Usage Guide

### Workflow 1: Building Initial Knowledge

**Week 1: Core Information**
```bash
# Add your website
/vc-knowledge https://yourcompany.com

# Add pitch deck
/vc-knowledge https://drive.google.com/your-pitch-deck

# Quick traction update
/vc-knowledge We've grown from 0 to 500 customers in 6 months with $100k MRR
```

**Week 2: Interactive Learning**
```bash
# Start learning session
/vc-learn

# Answer 10 questions about your startup
# Agent learns about team, product, market, traction, etc.
```

**Week 3: Ongoing Updates**
```bash
# Add press mentions
/vc-knowledge https://techcrunch.com/your-feature

# Update traction
/vc-knowledge Just hit $150k MRR, up 50% from last month

# Add product screenshots
[Upload image] + /vc-knowledge
```

### Workflow 2: Pre-Fundraise Preparation

1. **Complete Learning Session**
   ```
   /vc-learn
   ```
   Answer all questions thoroughly

2. **Add Key Materials**
   ```
   /vc-knowledge [pitch deck URL]
   /vc-knowledge [financial model]
   /vc-knowledge [product demo video]
   ```

3. **Update Traction**
   ```
   /vc-knowledge Latest metrics: 2000 users, $200k ARR, 40% MoM growth
   ```

4. **Check Knowledge Summary**
   ```
   /vc-knowledge-summary
   ```

5. **Find Investors**
   ```
   @InvestorAgent find investors for my startup
   ```
   Agent now has full context for accurate matching!

### Workflow 3: Continuous Knowledge Building

**Monthly Routine:**
- Update traction metrics
- Add recent press or blog posts
- Note key hires or milestones
- Share product updates

**Before Investor Outreach:**
- Review knowledge summary
- Add any missing critical info
- Run learning session if gaps exist

---

## Best Practices

### 1. Start with Learning Session

Run `/vc-learn` early - it's the fastest way to build comprehensive context.

### 2. Keep Knowledge Current

Update regularly with:
- Monthly traction metrics
- Significant milestones
- Product launches
- Team changes
- Fundraising updates

### 3. Be Specific

Better:
```
/vc-knowledge Closed $500k pre-seed from 3 angels (ex-Stripe, ex-Airbnb founders) in March 2024. Using for product development and first 2 engineering hires.
```

vs.
```
/vc-knowledge Raised some money
```

### 4. Diverse Content Types

Mix different formats:
- Links for official info
- Text for quick updates
- Images for visual proof (charts, screenshots)
- Videos for demos and pitches

### 5. Leverage Summaries

Check `/vc-knowledge-summary` regularly to:
- See what the agent knows
- Identify gaps
- Ensure accuracy

### 6. Use Before Major Searches

Before running investor searches:
1. Update knowledge base
2. Run learning session if needed
3. Review summary
4. Then search for investors

This ensures the best possible matches.

### 7. Categories Matter

The agent auto-categorizes into:
- **Product**: Features, roadmap, tech stack
- **Team**: Backgrounds, expertise, hires
- **Traction**: Metrics, growth, customers
- **Market**: Size, opportunity, competition
- **Funding**: History, current raise, use of funds
- **Strategy**: GTM, vision, goals

Ensure coverage across all categories.

---

## How Knowledge Improves Matching

### Without Knowledge Base:
```
Founder: @InvestorAgent find investors for my startup

Agent: I'll search based on general SaaS patterns...
- Returns generic SaaS investors
- Match scores: 60-75%
- Limited reasoning
```

### With Rich Knowledge Base:
```
Founder: @InvestorAgent find investors for my startup

Agent: Based on your knowledge base, I know you're:
- B2B SaaS, churn reduction, $50k MRR
- Seed stage, raising $2M
- 25% MoM growth, 500 customers
- Ex-Google/Stripe team

Finding investors who:
✓ Focus on B2B SaaS tools
✓ Invest at seed stage
✓ Write $1-3M checks
✓ Value strong growth metrics
✓ Appreciate experienced teams

- Returns highly targeted investors
- Match scores: 85-95%
- Detailed reasoning for each match
```

---

## Data Privacy

- Knowledge is scoped per user (Slack user ID)
- Stored securely in your Notion workspace
- Only you and the agent can access
- No data shared between users
- Delete anytime by removing from Notion

---

## Troubleshooting

**Q: Knowledge not being saved?**
- Check `NOTION_KNOWLEDGE_DATABASE_ID` is set
- Verify Notion integration has access to database
- Check logs for errors

**Q: Agent not using knowledge in searches?**
- Run `/vc-knowledge-summary` to verify knowledge is stored
- Try re-running learning session
- Ensure profile is set with `@InvestorAgent set profile`

**Q: Learning session not starting?**
- Check for existing active session (`/vc-learn-stop` first)
- Verify learning service is initialized (check startup logs)

**Q: File processing failing?**
- Ensure Slack app has `files:read` permission
- Check file size limits (10MB recommended max)
- Verify file type is supported

---

## Examples

### Comprehensive Knowledge Base Example

```
Knowledge Base Summary (15 items total):

• 3 links (website, pitch deck, TechCrunch article)
• 5 text notes (traction updates, team info)
• 2 images (product screenshots, growth chart)
• 3 documents (financial model, market research)
• 2 videos (product demo, founder intro)

Startup Profile:
Name: ChurnGuard
Industry: B2B SaaS
Stage: Seed

Key Insights (18 total):
1. Reduces churn by 30% for B2B SaaS companies
2. $50k MRR with 25% MoM growth
3. 500 enterprise customers
4. Ex-Google/Stripe founding team
5. Raising $2M seed round
6. Product launched 6 months ago
7. Targeting mid-market SaaS (50-500 employees)
...
```

With this knowledge, the agent can find perfect-fit investors with high confidence.

---

**The knowledge base is your secret weapon for fundraising success. The more the agent knows, the better it matches!** 🚀
