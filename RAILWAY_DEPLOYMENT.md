# Railway Deployment Guide - Investor Database Agent

## 🚀 Quick Deploy via Railway Dashboard

Since the Railway CLI cannot be installed in this environment, follow these steps to deploy via the Railway web interface:

### Step 1: Commit and Push Railway Configuration

The following files have been prepared for Railway deployment:
- ✅ `railway.json` - Railway configuration
- ✅ `Procfile` - Process file for Railway
- ✅ `.env.example` - Environment variable template

```bash
# Commit the new Railway configuration files
git add railway.json Procfile RAILWAY_DEPLOYMENT.md
git commit -m "chore: Add Railway deployment configuration"
git push origin main
```

### Step 2: Deploy via Railway Dashboard

1. **Go to Railway Dashboard**
   - Visit: https://railway.app/new
   - Log in with your GitHub account

2. **Create New Project**
   - Click "Deploy from GitHub repo"
   - Select: `2Rds/investor-database-agent`
   - Click "Deploy Now"

3. **Configure Environment Variables**

   In the Railway dashboard, go to your project → Variables → Raw Editor, and paste:

   ```env
   SLACK_BOT_TOKEN=xoxb-7000743189300-10199596010417-DzVktokicMHiPV0hr1cVTyxz
   SLACK_SIGNING_SECRET=67c996b0f2056fce25ac633b75e9ac11
   SLACK_APP_TOKEN=xapp-1-A0A5D6TNZNH-10199628278193-ccabf870f69e7911a91d447e18b1cfeb5b6f3daa5cf2de34d45994d8c3f95ccc
   ANTHROPIC_API_KEY=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
   NOTION_API_KEY=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
   NOTION_DATABASE_ID=2d4b9057154980e09b80f3cd5ac2123c
   NODE_ENV=production
   PORT=3000
   LOG_LEVEL=info
   MAX_CONCURRENT_RESEARCH=3
   RESEARCH_TIMEOUT_MS=300000
   ```

   **Optional enrichment APIs** (add if you have keys):
   ```env
   FIRECRAWL_API_KEY=fc-your-key-here
   APOLLO_API_KEY=your-apollo-key
   CLEARBIT_API_KEY=your-clearbit-key
   ZOOMINFO_API_KEY=your-zoominfo-key
   GOOGLE_SEARCH_API_KEY=your-google-key
   GOOGLE_SEARCH_CX=your-search-engine-id
   ```

4. **Deploy**
   - Railway will automatically detect `railway.json` and `package.json`
   - It will run: `npm install && npm run build`
   - Then start with: `npm start`
   - Monitor the deployment logs in the Railway dashboard

### Step 3: Verify Deployment

1. **Check Logs**
   - In Railway dashboard → Deployments → Latest → View Logs
   - Look for:
     ```
     ✅ Investor Database Agent is running!
     ⚡️ Bolt app is running!
     Health check endpoint listening on port 3000
     ```

2. **Test Health Endpoint**
   - Railway will provide a public URL (e.g., `https://your-app.railway.app`)
   - Visit: `https://your-app.railway.app/health`
   - Should return:
     ```json
     {
       "status": "healthy",
       "uptime": 123.45,
       "activeResearchTasks": 0,
       "queueSize": 0
     }
     ```

3. **Test Slack Integration**
   - Go to your Slack workspace
   - Try: `/vc-help`
   - Should see the command menu

### Step 4: Production Testing

Once deployed, test these commands in Slack:

```
/vc-help                           # View all commands
/vc-set-profile                    # Set startup profile
/vc-knowledge https://blockdrive.ai  # Add knowledge
/vc-learn                          # Start interactive learning
@InvestorAgent find 10 seed stage web3 investors
```

## 📊 Railway Configuration Details

### railway.json
```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install && npm run build"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  },
  "healthcheck": {
    "path": "/health",
    "interval": 60,
    "timeout": 10
  }
}
```

**What this does:**
- Uses Nixpacks builder (auto-detects Node.js)
- Installs dependencies and compiles TypeScript
- Starts the app with `npm start` (runs `node dist/index.js`)
- Auto-restarts on failure (max 10 retries)
- Health checks every 60 seconds at `/health`

### Procfile
```
web: npm start
```

**What this does:**
- Defines the web process
- Backup configuration if `railway.json` not used

## 💰 Railway Pricing

### Hobby Plan (Recommended for MVP)
- **$5/month** per service
- 500 hours of execution time
- 8 GB RAM / 8 vCPUs shared
- **Perfect for this agent** (always-on Slack bot)

### Developer Plan (If you scale)
- **$20/month**
- Unlimited execution time
- More resources

## 🔍 Monitoring & Debugging

### View Logs
```
Railway Dashboard → Your Project → Deployments → View Logs
```

Look for:
- ✅ `Investor Database Agent is running!`
- ✅ `Main Notion database validated`
- ✅ `Knowledge database validated`
- ✅ `Bolt app is running!`
- ✅ `Health check endpoint listening on port 3000`

### Common Issues

**Issue: "Missing environment variables"**
- Solution: Check Variables tab in Railway, ensure all required vars are set

**Issue: "Notion database validation failed"**
- Solution: Verify `NOTION_DATABASE_ID` is correct, check Notion integration permissions

**Issue: "Slack Socket Mode connection failed"**
- Solution: Verify `SLACK_APP_TOKEN` is correct, check Socket Mode is enabled in Slack app settings

**Issue: "Build failed"**
- Solution: Check Railway logs, verify `package.json` scripts are correct

## 🎯 Next Steps After Deployment

1. ✅ Verify health endpoint responds
2. ✅ Test Slack commands
3. ✅ Add BlockDrive knowledge via `/vc-knowledge` and `/vc-learn`
4. ✅ Run investor research: `@InvestorAgent find seed stage web3 investors`
5. ✅ Test enrichment with top 100 matches CSV
6. 🚀 Launch January 1 fundraising campaign

## 🔐 Security Notes

- All secrets stored in Railway environment variables (encrypted at rest)
- No `.env` file committed to git (gitignored)
- Health endpoint provides status only (no sensitive data exposed)
- Slack Socket Mode = no public webhooks (more secure)

## 📈 Performance Optimization

### Current Settings
- `MAX_CONCURRENT_RESEARCH=3` - Process 3 investors in parallel
- `RESEARCH_TIMEOUT_MS=300000` - 5 minutes max per research task
- `LOG_LEVEL=info` - Balanced logging (use `debug` if troubleshooting)

### For Heavy Usage (3,000 investor enrichment)
Consider upgrading to:
- `MAX_CONCURRENT_RESEARCH=5` (requires more Railway resources)
- Add Redis for queue management (Railway Redis plugin)

## 🎉 Deployment Checklist

- [ ] Code committed and pushed to GitHub
- [ ] Railway project created
- [ ] Environment variables configured
- [ ] Deployment successful (check logs)
- [ ] Health endpoint responding
- [ ] Slack commands working
- [ ] Notion integration validated
- [ ] Knowledge base tested
- [ ] Investor research tested
- [ ] Ready for production use

## 🚀 Deploy Now!

**Quick command:**
```bash
cd /home/user/investor-database-agent
git add railway.json Procfile RAILWAY_DEPLOYMENT.md
git commit -m "chore: Add Railway deployment configuration"
git push origin main
```

Then visit: **https://railway.app/new** and select your repo!

---

**Estimated deployment time:** 5-10 minutes
**Cost:** $5/month (Railway Hobby)
**Uptime:** 99.9% (Railway SLA)

Let's ship this! 🎉
