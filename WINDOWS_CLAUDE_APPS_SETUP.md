# Windows Setup Guide - Claude Apps Folder

## Your Project Location

Your project is located at:
```
C:\Users\Sean Weiss\Documents\Claude-Apps\investor-database-agent
```

## Quick Start - Run the Notion Scoring Script

### Step 1: Open PowerShell

Right-click the Start menu → Select "Windows PowerShell"

### Step 2: Navigate to Your Project

```powershell
cd $HOME\Documents\Claude-Apps\investor-database-agent
```

### Step 3: Verify You're in the Right Place

```powershell
# Check current directory
pwd

# Should show: C:\Users\Sean Weiss\Documents\Claude-Apps\investor-database-agent

# List files to confirm
ls

# Should see: package.json, src folder, etc.
```

### Step 4: Run the Notion Scoring Script

```powershell
npm run score-notion
```

**That's it!** The script will:
- Connect to your Notion database
- Fetch all investors
- Score them using the BlockDrive algorithm
- Update "# Match", "Tier", and "Match Detail" columns

---

## Expected Output

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
  ✅ Updated 250/250 investors...

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

3. Rubicon VC
   Match: 95% (S-Tier)
   Reason: Strong match: blockchain and cybersecurity focus with seed stage activity

...

🎉 All match scores have been updated in your Notion database!
📌 Check the "# Match", "Tier", and "Match Detail" columns
```

**Time:** 2-3 minutes for 250 investors

---

## Common Commands

### Navigate to Project Anytime

```powershell
cd $HOME\Documents\Claude-Apps\investor-database-agent
```

### Run the Scoring Script

```powershell
npm run score-notion
```

### Pull Latest Updates from GitHub

```powershell
cd $HOME\Documents\Claude-Apps\investor-database-agent
git pull origin claude/vc-lead-research-agent-QSDuJ
npm install
```

### Check What Scripts Are Available

```powershell
npm run
```

You'll see:
- `score-notion` - Score investors in Notion
- `analyze-csv` - Analyze CSV of investors
- `enrich-top-matches` - Enrich top matches with web data

---

## PowerShell Shortcuts

### Create a Desktop Shortcut

Save this as `Score-Notion.ps1` on your Desktop:

```powershell
# Score Notion Investors
cd $HOME\Documents\Claude-Apps\investor-database-agent
npm run score-notion
Read-Host "Press Enter to close"
```

Then right-click it → "Run with PowerShell"

### Create a Reusable Function

Add this to your PowerShell profile:

```powershell
function Score-Notion {
    cd $HOME\Documents\Claude-Apps\investor-database-agent
    npm run score-notion
}
```

Then you can just type `Score-Notion` from anywhere!

---

## Troubleshooting

### Error: "Cannot find path"

**Solution:** Make sure you're using the correct path with the hyphen:

```powershell
cd $HOME\Documents\Claude-Apps\investor-database-agent
```

**Note:** The folder is "Claude-Apps" (with hyphen), not "Claude Apps" (with space)

### Error: "npm is not recognized"

**Solution:** Install Node.js

1. Download from https://nodejs.org/
2. Install (use default options)
3. Restart PowerShell
4. Try again

### Error: "git is not recognized"

**Solution:** Install Git for Windows

1. Download from https://git-scm.com/download/win
2. Install (use default options)
3. Restart PowerShell
4. Try again

### Error: "Missing script: 'score-notion'"

**Solution:** Make sure you're in the right directory

```powershell
# Check where you are
pwd

# Should show: C:\Users\Sean Weiss\Documents\Claude-Apps\investor-database-agent

# If not, navigate there
cd $HOME\Documents\Claude-Apps\investor-database-agent

# Then try again
npm run score-notion
```

### Error: "NOTION_DATABASE_ID not found"

**Solution:** Create the `.env` file

```powershell
# Navigate to project
cd $HOME\Documents\Claude-Apps\investor-database-agent

# Create .env file
New-Item -Path .env -ItemType File -Force

# Open in Notepad
notepad .env
```

**Paste this into Notepad:**

```env
# Slack Configuration
SLACK_BOT_TOKEN=xoxb-7000743189300-10199596010417-DzVktokicMHiPV0hr1cVTyxz
SLACK_SIGNING_SECRET=67c996b0f2056fce25ac633b75e9ac11
SLACK_APP_TOKEN=xapp-1-A0A5D6TNZNH-10199628278193-ccabf870f69e7911a91d447e18b1cfeb5b6f3daa5cf2de34d45994d8c3f95ccc

# Anthropic Configuration
ANTHROPIC_API_KEY=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

# Notion Configuration
NOTION_API_KEY=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
NOTION_DATABASE_ID=2d4b905715498084b36ffcba1d635110
NOTION_KNOWLEDGE_DATABASE_ID=

# Optional: External APIs for enrichment
CRUNCHBASE_API_KEY=
PITCHBOOK_API_KEY=

# Application Configuration
NODE_ENV=development
PORT=3000
LOG_LEVEL=info

# Rate Limiting
MAX_CONCURRENT_RESEARCH=3
RESEARCH_TIMEOUT_MS=300000
```

**Save (Ctrl+S) and close Notepad**

---

## When to Run the Script

### Weekly Routine (Recommended)

```powershell
# Every Monday morning
cd $HOME\Documents\Claude-Apps\investor-database-agent
npm run score-notion
```

**Takes 2-3 minutes, keeps your Notion database fresh**

### After Adding New Investors

```powershell
# Just added 20 new investors to Notion? Score them!
cd $HOME\Documents\Claude-Apps\investor-database-agent
npm run score-notion
```

### Before Outreach Campaigns

```powershell
# About to start investor outreach? Get fresh scores!
cd $HOME\Documents\Claude-Apps\investor-database-agent
npm run score-notion
```

---

## View Results in Notion

### Step 1: Open Your Notion Database

Go to your Notion Fundraising Tracker

### Step 2: Filter by S-Tier

1. Click "Filter" at the top
2. Add filter: `Tier` → `equals` → `S-Tier`
3. See your top priority investors (90-100% match)

### Step 3: Sort by # Match

1. Click the "# Match" column header
2. Select "Sort Descending"
3. Highest matches appear first

### Step 4: Review Match Detail

Click on any investor to see the detailed breakdown of why they match

---

## Next Steps

### 1. Run the Script Now

```powershell
cd $HOME\Documents\Claude-Apps\investor-database-agent
npm run score-notion
```

### 2. Check Notion

Open your database and look for:
- **# Match** column (0-100 scores)
- **Tier** column (S-Tier, A-Tier, etc.)
- **Match Detail** column (detailed reasoning)

### 3. Filter for Top Matches

Filter by `Tier = S-Tier` to see your priority targets

### 4. Start Outreach

Use the scored list for your January 1 fundraising campaign!

---

## Quick Reference

| Task | Command |
|------|---------|
| Navigate to project | `cd $HOME\Documents\Claude-Apps\investor-database-agent` |
| Score Notion investors | `npm run score-notion` |
| Pull latest updates | `git pull origin claude/vc-lead-research-agent-QSDuJ` |
| Install dependencies | `npm install` |
| List available scripts | `npm run` |

---

## Pro Tips

### 1. Use Tab Completion

Type the first few letters, then press Tab:

```powershell
cd $HOME\Doc[TAB]\Clau[TAB]\inv[TAB]
# Becomes: cd $HOME\Documents\Claude-Apps\investor-database-agent
```

### 2. Create an Alias

```powershell
# Add to your PowerShell profile
Set-Alias -Name score -Value Score-Notion
```

Then just type `score` to run the script!

### 3. Schedule It

Use Windows Task Scheduler to run it automatically every Monday at 9 AM

---

## You're All Set! 🚀

Your Notion scoring script is ready to go at:
```
C:\Users\Sean Weiss\Documents\Claude-Apps\investor-database-agent
```

Just run:
```powershell
cd $HOME\Documents\Claude-Apps\investor-database-agent
npm run score-notion
```

And watch your Notion database get scored with BlockDrive match intelligence! 🎯
