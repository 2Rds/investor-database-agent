# 📊 Data Enrichment Guide

## Overview

The Investor Database Agent supports multiple enrichment sources to transform your raw investor lists into comprehensive, actionable databases with verified contact information, company data, and recent activity tracking.

**Perfect for:** Enriching large spreadsheets (e.g., 3,000+ investors) with verified emails, company details, and activity data.

---

## 🚀 Quick Start: Bulk Enrichment

### Upload Your Investor Spreadsheet

```
/vc-bulk-enrich
```

Then upload a CSV file or paste CSV data with this format:

```csv
name,email,firmName,website
Sequoia Capital,,,sequoiacap.com
Marc Andreessen,marc@a16z.com,Andreessen Horowitz,a16z.com
Naval Ravikant,naval@angellist.com,AngelList,angel.co
```

**Required column:**
- `name` - Investor or firm name

**Optional columns:**
- `email` - Email address (will be enriched if missing)
- `firmName` - Firm name if different from name
- `website` - Company website (will be discovered if missing)

### What Happens Next

The agent will:
1. **Find verified emails** (Apollo.io)
2. **Enrich company data** (Crunchbase, Clearbit)
3. **Check recent activity** (Google Search - last 6 months)
4. **Add to Notion database** with all enriched data

**Processing:**
- ~10-15 seconds per investor
- Progress updates every 100 investors
- Runs in background (you can continue working)
- **3,000 investors** = ~8-12 hours total

---

## 📡 Enrichment Sources

### 1. Apollo.io - Contact Enrichment ⭐ Recommended

**What it does:**
- Finds verified email addresses
- Enriches LinkedIn profiles
- Provides company information
- Phone numbers (when available)

**Cost:** $49-149/month
**API Signup:** https://apollo.io/

**Data returned:**
- ✅ Verified email addresses
- ✅ LinkedIn URLs
- ✅ Company name and website
- ✅ Job titles and roles

**Configuration:**
```env
APOLLO_API_KEY=your_apollo_api_key
```

**Best for:**
- Finding contact emails from names/companies
- Enriching partial contact data
- B2B lead enrichment

---

### 2. Crunchbase - Investor Profiles ⭐ Recommended

**What it does:**
- Comprehensive investor/firm profiles
- Investment history and portfolio companies
- Funding rounds and check sizes
- Team members and partners

**Cost:** $29-99/month
**API Signup:** https://crunchbase.com/solutions/crunchbase-pro

**Data returned:**
- ✅ Firm description and investment thesis
- ✅ Portfolio companies and investments
- ✅ Check size ranges
- ✅ Geographic focus
- ✅ Industry preferences
- ✅ Stage preferences

**Configuration:**
```env
CRUNCHBASE_API_KEY=your_crunchbase_api_key
```

**Best for:**
- VC and PE firm research
- Investment thesis analysis
- Portfolio overlap identification

---

### 3. Clearbit - Company Enrichment

**What it does:**
- Company enrichment from domain
- Employee count and tech stack
- Industry classification
- Social media profiles

**Cost:** $99/month (pay-per-enrichment available)
**API Signup:** https://clearbit.com/

**Data returned:**
- ✅ Company name and description
- ✅ Employee count
- ✅ Location and geography
- ✅ LinkedIn company page
- ✅ Tech stack used
- ✅ Industry tags

**Configuration:**
```env
CLEARBIT_API_KEY=your_clearbit_api_key
```

**Best for:**
- Enriching from website domains
- Tech stack analysis
- Company size classification

---

### 4. Google Custom Search - Website Discovery & Activity ⭐ Recommended

**What it does:**
- Automatically finds investor websites
- Tracks recent news and activity
- Identifies active vs. inactive investors
- Portfolio announcements

**Cost:** Free (up to 100 queries/day), then $5/1000 queries
**API Signup:** https://developers.google.com/custom-search

**Setup:**
1. Go to https://console.cloud.google.com/
2. Create a new project
3. Enable "Custom Search API"
4. Create API credentials
5. Go to https://cse.google.com/cse/all
6. Create a custom search engine
7. Get your Search Engine ID (CX)

**Data returned:**
- ✅ Investor website URLs
- ✅ Recent news articles (last 6 months)
- ✅ Investment announcements
- ✅ Activity status (active/inactive)

**Configuration:**
```env
GOOGLE_SEARCH_API_KEY=your_google_api_key
GOOGLE_SEARCH_CX=your_custom_search_engine_id
```

**Best for:**
- Finding missing website URLs
- Recent activity tracking
- News monitoring

---

### 5. PitchBook - PE/VC Market Data (Enterprise)

**What it does:**
- Deep PE/VC market intelligence
- Fund performance metrics
- LP (Limited Partner) data
- Valuation and exit analysis

**Cost:** ~$20,000+/year (enterprise pricing)
**API Signup:** https://pitchbook.com/

**Data returned:**
- ✅ Fund performance
- ✅ LP information
- ✅ Valuation data
- ✅ Exit analysis
- ✅ Market trends

**Configuration:**
```env
PITCHBOOK_API_KEY=your_pitchbook_api_key
```

**Best for:**
- Enterprise-level investor research
- Fund performance analysis
- LP relationship mapping

**Note:** Only implement if you have enterprise budget. Most startups won't need this.

---

## 💰 Cost Breakdown

### Recommended Setup for 3,000 Investors

| Service | Monthly Cost | Annual Cost | Value |
|---------|-------------|-------------|-------|
| **Apollo.io** | $49-149 | $588-1,788 | Verified emails for all contacts |
| **Crunchbase** | $29-99 | $348-1,188 | Comprehensive investor profiles |
| **Google Search** | $5-10 | $60-120 | Website discovery + recent activity |
| **Clearbit** | Pay-per-use | ~$200-500 | Company enrichment on-demand |
| **Total** | **~$100-200/mo** | **~$1,200-2,400/yr** | **Full enrichment pipeline** |

### Budget Options

**Minimum viable ($50-100/month):**
- Apollo.io ($49) - Get emails
- Google Custom Search ($5) - Recent activity
- Skip Crunchbase initially (use AI research)

**Recommended ($100-200/month):**
- Apollo.io ($49-149) - Contact enrichment
- Crunchbase ($29-99) - Investor profiles
- Google Custom Search ($5-10) - Activity tracking
- Clearbit (pay-per-use) - Company data

**Enterprise ($20,000+/year):**
- All of the above
- PitchBook ($20k+) - Deep market intelligence

---

## 🔄 Enrichment Workflow

### Automatic Multi-Source Enrichment

When you use `/vc-bulk-enrich`, the agent automatically:

1. **Apollo.io Enrichment**
   - Searches for contact by name + company
   - Retrieves verified email
   - Gets LinkedIn profile
   - Adds company details

2. **Clearbit Enrichment** (if website available)
   - Enriches company from domain
   - Gets employee count and tech stack
   - Adds industry classification
   - Retrieves LinkedIn company page

3. **Crunchbase Enrichment** (if firm name available)
   - Looks up investor/firm profile
   - Gets investment thesis
   - Retrieves portfolio companies
   - Adds check size and stage preferences

4. **Google Search Enrichment**
   - Searches for recent news (last 6 months)
   - Identifies investment announcements
   - Marks as active/inactive
   - Adds recent activity notes

5. **AI Analysis** (always)
   - Claude analyzes all collected data
   - Synthesizes investment thesis
   - Identifies industry focus
   - Calculates match score

### Enrichment Success Rates

Based on typical data quality:

| Metric | Success Rate |
|--------|-------------|
| Email found (from name + company) | 60-80% |
| Company data enriched (from domain) | 85-95% |
| Investor profile found (from firm name) | 70-85% |
| Recent activity detected | 40-60% |
| **Overall enrichment rate** | **75-90%** |

---

## 📝 CSV Format Guide

### Basic Format

```csv
name,email,firmName,website
Sequoia Capital,,,sequoiacap.com
Marc Andreessen,marc@a16z.com,Andreessen Horowitz,a16z.com
```

### Extended Format (more starting data = better enrichment)

```csv
name,email,firmName,website,linkedIn
Sequoia Capital,,Sequoia Capital,sequoiacap.com,https://linkedin.com/company/sequoia-capital
Marc Andreessen,marc@a16z.com,Andreessen Horowitz,a16z.com,https://linkedin.com/in/pmarca
Naval Ravikant,naval@angellist.com,AngelList,angel.co,https://linkedin.com/in/naval
```

### Tips for Best Results

✅ **DO:**
- Include firm name when investor is a partner/individual
- Provide website domains (not full URLs)
- Use consistent naming (full names, not abbreviations)
- Include LinkedIn URLs if you have them

❌ **DON'T:**
- Mix individual investors and firms without clarification
- Use abbreviations (use "Andreessen Horowitz" not "a16z")
- Include duplicate entries
- Leave name column empty

---

## 🎯 Use Cases

### 1. Fundraising Lead Enrichment

**Scenario:** You have 3,000 potential investors from various sources

**Process:**
1. Combine all sources into one CSV
2. `/vc-bulk-enrich` with the CSV
3. Wait 8-12 hours
4. Review enriched database in Notion
5. Filter for best matches

**Result:**
- Verified emails for outreach
- Investment thesis for personalization
- Recent activity to prioritize active investors

### 2. Investor Database Maintenance

**Scenario:** Annual update of your investor CRM

**Process:**
1. Export current database
2. `/vc-bulk-enrich` to refresh data
3. Update recent activity status
4. Identify inactive investors to remove

**Result:**
- Up-to-date contact information
- Active/inactive classification
- Fresh investment thesis data

### 3. Market Research

**Scenario:** Analyzing VC investment trends in blockchain/web3

**Process:**
1. Build list of web3-focused VCs
2. Enrich with recent activity tracking
3. Analyze investment patterns
4. Identify most active firms

**Result:**
- Comprehensive VC landscape view
- Recent investment trends
- Prioritized outreach list

---

## 🔧 Advanced Configuration

### Rate Limiting

Adjust enrichment speed in `.env`:

```env
# Process more investors in parallel (faster, but higher API costs)
MAX_CONCURRENT_RESEARCH=5

# Longer timeout for slow APIs
RESEARCH_TIMEOUT_MS=600000  # 10 minutes
```

### Custom Enrichment Logic

Edit `src/services/research/enrichment.ts` to:
- Add new enrichment sources
- Customize data mapping
- Implement custom scoring logic
- Add validation rules

---

## 🚨 Troubleshooting

### Common Issues

**"No email found for 80% of investors"**
- Solution: Add company/website data to improve Apollo matching
- Alternative: Use LinkedIn URLs for better matching

**"Crunchbase enrichment failing"**
- Check API key is valid
- Verify firm names match Crunchbase database (exact match required)
- Use official firm names, not abbreviations

**"Enrichment taking too long"**
- Normal: 3,000 investors takes 8-12 hours
- Speed up: Increase `MAX_CONCURRENT_RESEARCH` (costs more)
- Alternative: Process in smaller batches (500 at a time)

**"Many investors marked as inactive"**
- This is expected: ~40-60% of VCs are inactive or not actively deploying
- Use this to filter your outreach list
- Focus on investors with recent activity

---

## 📊 Enrichment Quality Metrics

Track enrichment quality in Slack. The agent reports:

```
🎉 Bulk enrichment complete!

📊 Results:
• Total processed: 3000
• Successfully enriched: 2550
• Added to database: 2350
• Failed: 450

Enrichment rate: 85%
```

**Good enrichment rate:** 75-90%
**Excellent enrichment rate:** 90%+
**Poor enrichment rate:** <60% (check data quality)

---

## 🔐 Security & Privacy

All API keys are:
- ✅ Stored in environment variables (never committed to git)
- ✅ Encrypted in Railway/deployment platform
- ✅ Only accessible to the agent
- ✅ Never logged or exposed

Data handling:
- ✅ All enriched data stored in your Notion database (you own it)
- ✅ No data shared with third parties
- ✅ Compliance with GDPR/CCPA for business use
- ✅ API keys can be revoked anytime

---

## 🎓 Next Steps

1. **Set up API keys** (start with Apollo + Google Search)
2. **Test with small batch** (10-20 investors first)
3. **Review enrichment quality**
4. **Run full enrichment** on your 3,000 investor list
5. **Filter and prioritize** based on enriched data
6. **Start outreach** with personalized messages

---

## 💡 Pro Tips

1. **Start with the best sources:** Apollo + Crunchbase + Google Search covers 90% of use cases

2. **Process overnight:** Kick off bulk enrichment before bed, wake up to enriched database

3. **Enrich in stages:**
   - Week 1: Get emails (Apollo)
   - Week 2: Add company data (Clearbit)
   - Week 3: Check activity (Google)

4. **Validate before enriching:** Clean your CSV first (remove duplicates, fix formatting)

5. **Monitor costs:** Start with free tiers, upgrade as you see ROI

6. **Combine with AI matching:** Use `/vc-knowledge` to teach the agent about your startup for better match scoring

7. **Regular updates:** Re-enrich quarterly to catch new investments and activity

---

## 📞 Support

**Issues with enrichment?**
- Check API key configuration in `.env`
- Review logs for specific error messages: `railway logs`
- Test individual API integrations one at a time
- Start with small batch (10 investors) to debug

**Need custom enrichment sources?**
- Edit `src/services/research/enrichment.ts`
- Follow existing pattern for new APIs
- Add configuration to `src/config/index.ts`
- Update `.env.example` with new keys

---

**Ready to enrich your 3,000 investors? Start with `/vc-bulk-enrich`!** 🚀
