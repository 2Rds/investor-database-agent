# Windows PowerShell Setup Guide

## Running the Notion Scoring Script on Windows

### Step 1: Navigate to Project Directory

Open Windows PowerShell and navigate to your project folder:

```powershell
cd "C:\path\to\investor-database-agent"
```

For example:
```powershell
cd "C:\Users\Sean Weiss\Documents\investor-database-agent"
```

### Step 2: Pull Latest Changes from GitHub

```powershell
git pull origin claude/vc-lead-research-agent-QSDuJ
```

This will download the latest scoring script and updates.

### Step 3: Verify package.json Has the Script

Check that the script is in package.json:

```powershell
npm run
```

You should see `score-notion` in the list of available scripts.

### Step 4: Install Dependencies (if needed)

If you just pulled changes:

```powershell
npm install
```

### Step 5: Run the Scoring Script

```powershell
npm run score-notion
```

## Troubleshooting

### Error: "Missing script: 'score-notion'"

**Solution:**
1. Make sure you're in the project directory (where package.json is located)
2. Pull the latest changes: `git pull origin claude/vc-lead-research-agent-QSDuJ`
3. Verify the script exists: `npm run` (should show score-notion in the list)

### Error: "NOTION_API_KEY not found"

**Solution:**
Make sure you have a `.env` file in the project root with:

```env
NOTION_API_KEY=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
NOTION_DATABASE_ID=2d4b905715498084b36ffcba1d635110
```

### Error: "tsx is not recognized"

**Solution:**
```powershell
npm install
```

This will install all required dependencies including tsx.

### Error: "Cannot find module"

**Solution:**
```powershell
npm install
npm run score-notion
```

## Quick Start (All Steps)

```powershell
# Navigate to project
cd "C:\path\to\investor-database-agent"

# Pull latest changes
git pull origin claude/vc-lead-research-agent-QSDuJ

# Install dependencies
npm install

# Run the scoring script
npm run score-notion
```

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
...
```

## Notes for Windows Users

- Use double quotes for paths with spaces: `cd "C:\My Projects\investor-database-agent"`
- PowerShell is recommended over Command Prompt
- Make sure Node.js is installed (version 18+): `node --version`
- Git should be installed: `git --version`

## Alternative: Use the Full Path

If you're having trouble, you can run the script directly:

```powershell
npx tsx src/scripts/score-notion-investors.ts
```

This bypasses npm scripts and runs the TypeScript file directly.
