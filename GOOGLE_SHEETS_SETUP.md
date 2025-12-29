# Google Sheets → Notion Autonomous Scoring Agent

## Overview

This autonomous agent:
1. ✅ **Reads** all investors from your Google Sheet
2. ✅ **Scores** them using the BlockDrive algorithm (100-point system)
3. ✅ **Creates** a fresh Notion database with perfect schema
4. ✅ **Populates** it with all scored investors
5. ✅ **No manual work** - completely autonomous!

**No more CSV import issues, no more "multiple data sources" errors!**

---

## Prerequisites

### 1. Google Sheets API Key

You need a Google Sheets API key to read from your spreadsheet.

#### Step 1: Enable Google Sheets API

1. Go to https://console.cloud.google.com/
2. Create a new project (or select existing):
   - Click "Select a project" → "New Project"
   - Name it "BlockDrive Investor Scoring"
   - Click "Create"

3. Enable the Google Sheets API:
   - Go to https://console.cloud.google.com/apis/library
   - Search for "Google Sheets API"
   - Click on it
   - Click "Enable"

#### Step 2: Create API Key

1. Go to https://console.cloud.google.com/apis/credentials
2. Click "Create Credentials" → "API Key"
3. **Copy the API key** (looks like: `AIzaSy...`)
4. Click "Restrict Key" (recommended):
   - Under "API restrictions" → "Restrict key"
   - Select "Google Sheets API"
   - Click "Save"

#### Step 3: Make Your Google Sheet Public (Read-Only)

1. Open your Google Sheet: https://docs.google.com/spreadsheets/d/1ZkmDtxCO8rtOOG4E8TT9drNhi-HV3UZdYw2GlAM98vc
2. Click "Share" (top right)
3. Under "General access" → Change to "Anyone with the link" → "Viewer"
4. Click "Done"

**This allows the API to read your sheet (read-only, no one can edit).**

---

### 2. Notion Parent Page ID

You need a page ID where the new database will be created.

#### Option A: Use Your Workspace Home (Easiest)

1. Go to your Notion workspace
2. Create a new page called "Investor Databases"
3. Open it and copy the URL:
   ```
   https://www.notion.so/Investor-Databases-XXXXXXXXXXXXX
   ```
4. The page ID is the part after the last dash (the X's)
5. Remove hyphens to make it one continuous string

#### Option B: Use An Existing Page

1. Open any Notion page where you want the database created
2. Copy the page ID from the URL
3. Remove hyphens

---

## Setup

### Step 1: Update Your .env File

```powershell
cd $HOME\Documents\Claude-Apps\investor-database-agent
notepad .env
```

Add these lines at the end:

```env
# Google Sheets Configuration
GOOGLE_SHEETS_API_KEY=AIzaSy...your-api-key-here

# Notion Parent Page (where database will be created)
NOTION_PARENT_PAGE_ID=your-page-id-here
```

**Example:**
```env
GOOGLE_SHEETS_API_KEY=AIzaSyDxH3vK9mP2...
NOTION_PARENT_PAGE_ID=1234567890abcdef1234567890abcdef
```

Save and close.

---

## Usage

### Run the Autonomous Agent

```powershell
cd $HOME\Documents\Claude-Apps\investor-database-agent
npm run sheets-to-notion
```

**That's it!** The script will:

1. Read all 3,000 investors from your Google Sheet
2. Score each one with the BlockDrive algorithm
3. Create a fresh Notion database called "BlockDrive Investor Database - Scored"
4. Populate it with all scored investors
5. Save the database ID to `NOTION_DATABASE_ID.txt`

---

## Expected Output

```
🎯 BlockDrive Investor Scoring - Google Sheets → Notion

============================================================

📥 Reading investor data from Google Sheets...

✅ Found 2,894 investors in Google Sheet

📊 Scoring investors with BlockDrive algorithm...

📈 Match Score Distribution:

🌟 S-Tier (90-100%):  15 investors
⭐ A-Tier (75-89%):   45 investors
📌 B-Tier (50-74%):   320 investors
📎 C-Tier (25-49%):   890 investors
❌ Not a Match (<25%): 1,624 investors

============================================================

🏗️  Creating fresh Notion database...

✅ Created database: 2d4b9057-1549-8084-b36f-fcba1d635110

🔗 View at: https://notion.so/2d4b90571549808
4b36ffcba1d635110

💾 Populating Notion database with scored investors...

  ✅ Added 50/2894 investors...
  ✅ Added 100/2894 investors...
  ...
  ✅ Added 2894/2894 investors...

============================================================

✅ Scoring Complete!

Total Investors: 2,894
Successfully Added: 2,894
Failed: 0

============================================================

🏆 Top 10 Matches for BlockDrive:

1. Bedrock Capital
   Match: 100% (S-Tier)
   Reason: Perfect fit for BlockDrive: blockchain infrastructure with strong privacy/security focus

2. Blue Bear Capital
   Match: 97% (A-Tier)
   Reason: Excellent match: web3 infrastructure investor with cybersecurity expertise

3. Rubicon VC
   Match: 95% (S-Tier)
   Reason: Strong match: blockchain and cybersecurity focus with seed stage activity

...

🎉 All investors have been scored and added to your new Notion database!
🔗 View at: https://notion.so/2d4b90571549808 4b36ffcba1d635110

📌 Filter by "Tier = S-Tier" to see your top priority targets!

💾 Database ID saved to NOTION_DATABASE_ID.txt
```

**Time:** ~15-20 minutes for 3,000 investors (includes rate limiting for Notion API)

---

## What Gets Created

### Notion Database Schema

Your new database will have these columns:

| Column | Type | Description |
|--------|------|-------------|
| **Firm Name** | Title | Investor/firm name |
| **# Match** | Number | Match score (0-100) |
| **Tier** | Select | S-Tier, A-Tier, B-Tier, C-Tier, Not a Match |
| **Match Detail** | Rich Text | Detailed scoring breakdown |
| **Investor Type** | Select | VC, Angel, Family Office, Corporate VC |
| **Investment Focus** | Rich Text | Investment thesis/focus |
| **Partner Name** | Rich Text | Contact person |
| **Partner Email** | Email | Contact email |
| **Website** | URL | Firm website |
| **LinkedIn** | URL | LinkedIn profile |
| **Stage** | Multi-Select | Pre-Seed, Seed, Series A, Series B+ |
| **Check Size** | Rich Text | Average check size |
| **Geography** | Rich Text | Geographic focus |
| **Enriched** | Checkbox | Automatically checked |
| **Added Date** | Date | When added |

---

## Next Steps After Running

### 1. Open Your New Database

The script will output a direct link:
```
🔗 View at: https://notion.so/2d4b90571549808 4b36ffcba1d635110
```

Click it to see your scored database!

### 2. Filter by S-Tier

1. Click "Filter" at the top
2. Add filter: `Tier` → `equals` → `S-Tier`
3. See your top 15 priority targets (90-100% match)

### 3. Sort by # Match

1. Click the "# Match" column header
2. Select "Sort Descending"
3. Highest matches appear first

### 4. Review Match Details

Click on any investor to see the detailed breakdown of why they match

### 5. Start Outreach

Use the S-Tier and A-Tier investors for your January 1 fundraising campaign!

---

## Troubleshooting

### Error: "Request had insufficient authentication scopes"

**Solution:** Your Google Sheets API key doesn't have access

1. Make sure you enabled the Google Sheets API
2. Make sure your spreadsheet is shared as "Anyone with the link" → "Viewer"
3. Try creating a new API key

### Error: "The caller does not have permission"

**Solution:** Your Google Sheet isn't public

1. Open the Google Sheet
2. Click "Share"
3. Change "General access" to "Anyone with the link" → "Viewer"
4. Click "Done"

### Error: "Could not find page"

**Solution:** Wrong Notion parent page ID

1. Open the Notion page where you want the database created
2. Copy the URL
3. Extract the page ID (the part after the last dash)
4. Remove hyphens
5. Update `NOTION_PARENT_PAGE_ID` in .env

### Error: "Validation failed"

**Solution:** Notion integration doesn't have access to the parent page

1. Open the parent page in Notion
2. Click "..." (three dots, top right)
3. Click "Connections" → "Add connections"
4. Select "Investor-Database-Agent"

### No data found

**Solution:** Wrong sheet name or range

The script reads from "Sheet1!A:Z". If your sheet has a different name:

1. Open `src/scripts/google-sheets-to-notion.ts`
2. Find `range: 'Sheet1!A:Z'`
3. Change "Sheet1" to your actual sheet name
4. Save and run again

---

## Advantages Over Manual Notion Upload

✅ **No CSV import issues** - reads directly from Google Sheets
✅ **No "multiple data sources" errors** - creates clean, standalone database
✅ **Automatic schema** - perfect column types, no manual setup
✅ **Pre-scored** - all investors scored before upload
✅ **Tier colors** - S-Tier (green), A-Tier (blue), etc.
✅ **Completely autonomous** - one command, done!

---

## Re-Running the Script

If you need to re-score investors:

```powershell
npm run sheets-to-notion
```

This will create a **new database** each time (doesn't overwrite the old one).

You can:
- Keep both for comparison
- Delete the old one manually
- Archive the old one

---

## Optional: Update Google Sheet Structure

The script automatically maps these column names (case-insensitive):

| Your Column | Maps To |
|-------------|---------|
| Firm Name / FirmName | firmName |
| Investor Type | investorType |
| Investment Focus / Focus | investmentFocus |
| First Name | firstName |
| Last Name | lastName |
| Email / Contact Email | email |
| Website | website |
| LinkedIn / LinkedIn Profile | linkedInProfile |
| Stage / Investment Stage | stage |
| Check Size / Avg Check Size | avgCheckSize |
| Geography / Preferred Geography | preferredGeography |
| Description / Firm Description | firmDescription |

Add these columns to your Google Sheet for better scoring accuracy!

---

## You're Ready! 🚀

Just run:

```powershell
cd $HOME\Documents\Claude-Apps\investor-database-agent
npm run sheets-to-notion
```

And watch as the agent autonomously:
1. Reads your Google Sheet
2. Scores all 3,000 investors
3. Creates a perfect Notion database
4. Populates it with all results

**No manual work, no errors, just results!** 🎯
