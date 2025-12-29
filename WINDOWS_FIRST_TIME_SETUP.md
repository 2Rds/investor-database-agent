# First Time Setup on Windows - Complete Guide

## Step 1: Choose a Location for Your Project

Open Windows PowerShell and navigate to where you want to keep the project:

```powershell
# Option A: Use Documents folder (recommended)
cd "$HOME\Documents"

# Option B: Create a dedicated Projects folder
cd "$HOME\Documents"
mkdir Projects
cd Projects

# Option C: Use Desktop
cd "$HOME\Desktop"
```

## Step 2: Clone the Repository from GitHub

```powershell
git clone https://github.com/2Rds/investor-database-agent.git
```

This will create a new folder called `investor-database-agent` with all the code.

## Step 3: Navigate into the Project

```powershell
cd investor-database-agent
```

## Step 4: Switch to the Development Branch

```powershell
git checkout claude/vc-lead-research-agent-QSDuJ
```

This branch has all the latest Notion scoring features.

## Step 5: Install Dependencies

```powershell
npm install
```

This will install all required packages (takes 1-2 minutes).

## Step 6: Create the .env File

Create a new file called `.env` in the project root with this content:

```powershell
# Create the .env file
New-Item -Path .env -ItemType File -Force

# Open it in Notepad to edit
notepad .env
```

**Paste this into the .env file:**

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

**Save and close Notepad (File → Save, then close).**

## Step 7: Verify Setup

Check that everything is ready:

```powershell
# Verify you're in the right directory
pwd

# Should show something like: C:\Users\Sean Weiss\Documents\investor-database-agent

# Verify the script exists
npm run

# Should show "score-notion" in the list
```

## Step 8: Run the Notion Scoring Script

```powershell
npm run score-notion
```

**You should see:**

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
...
```

---

## Quick Copy-Paste Version (All Steps)

Open PowerShell and paste this:

```powershell
# Navigate to Documents folder
cd "$HOME\Documents"

# Clone the repository
git clone https://github.com/2Rds/investor-database-agent.git

# Navigate into the project
cd investor-database-agent

# Switch to development branch
git checkout claude/vc-lead-research-agent-QSDuJ

# Install dependencies
npm install

# Create .env file
New-Item -Path .env -ItemType File -Force
```

**Then:**
1. Run `notepad .env`
2. Paste the environment variables from Step 6 above
3. Save and close Notepad
4. Run `npm run score-notion`

---

## Troubleshooting

### Error: "git is not recognized"

**Solution:** Install Git for Windows
1. Download from: https://git-scm.com/download/win
2. Run the installer
3. Restart PowerShell
4. Try again

### Error: "npm is not recognized"

**Solution:** Install Node.js
1. Download from: https://nodejs.org/ (LTS version)
2. Run the installer
3. Restart PowerShell
4. Verify: `node --version` (should show v18.x or higher)
5. Try again

### Error: "Permission denied"

**Solution:** Run PowerShell as Administrator
1. Right-click PowerShell icon
2. Select "Run as Administrator"
3. Try again

### Error: "Cannot find module"

**Solution:**
```powershell
npm install
npm run score-notion
```

### Error: "NOTION_DATABASE_ID not found"

**Solution:** Make sure you created the `.env` file in Step 6
```powershell
# Verify .env exists
ls .env

# If not, create it again
New-Item -Path .env -ItemType File -Force
notepad .env
```

---

## Project Location

After setup, your project will be at:
```
C:\Users\Sean Weiss\Documents\investor-database-agent\
```

You can always navigate back to it with:
```powershell
cd "$HOME\Documents\investor-database-agent"
```

---

## Next Steps After Scoring

1. **Check Notion Database**
   - Open your Notion VC database
   - Look for updated "# Match", "Tier", and "Match Detail" columns
   - Filter by `Tier = S-Tier` to see top matches

2. **Export Top Matches**
   - Use Notion's export feature to download S-Tier investors
   - Use for personalized outreach

3. **Update Regularly**
   - Re-run `npm run score-notion` after adding new investors
   - Keeps scores fresh and up-to-date

---

## That's It!

You now have the full investor database agent running locally on Windows with Notion integration! 🎉
