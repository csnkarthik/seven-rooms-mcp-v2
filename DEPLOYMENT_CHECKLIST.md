# Deployment Checklist

Use this checklist when deploying the SevenRooms MCP Server to Azure.

## Pre-Deployment

- [ ] Clone the repository locally
- [ ] Run `npm install` to verify dependencies
- [ ] Run `npm test` to verify all 7 tests pass
- [ ] Run `npm run build` to verify TypeScript compiles without errors
- [ ] Review `src/index.ts` and verify SevenRooms API endpoints match your account

## GitHub Setup

- [ ] Push code to a GitHub repository (or use existing repo)
- [ ] Go to repository **Settings → Secrets and variables → Actions**
- [ ] Create secret: `AZURE_WEBAPP_NAME` (your Azure Web App name)
- [ ] Create secret: `AZURE_WEBAPP_PUBLISH_PROFILE` (XML from Azure publish profile)

## Azure Setup

1. **Create Web App**
   - [ ] Go to Azure portal → Create resource → Web App
   - [ ] Set runtime stack: Node.js 18 LTS (or later)
   - [ ] Create or select existing resource group
   - [ ] Click "Review + create" → Create

2. **Download Publish Profile**
   - [ ] In Azure portal, go to the created Web App
   - [ ] Click "Get publish profile" (top right)
   - [ ] Save the XML file locally
   - [ ] Copy the entire XML content

3. **Add Publish Profile to GitHub**
   - [ ] Go to your GitHub repository
   - [ ] Settings → Secrets and variables → Actions → New repository secret
   - [ ] Name: `AZURE_WEBAPP_PUBLISH_PROFILE`
   - [ ] Value: (paste the entire publish profile XML)
   - [ ] Click "Add secret"

4. **Configure App Service Environment Variables**
   - [ ] In Azure portal, go to your Web App
   - [ ] Click "Configuration" (left sidebar)
   - [ ] Click "New application setting"
   - [ ] Add:
     - Name: `SEVENROOMS_API_KEY` | Value: `your_api_key_here`
     - Name: `SEVENROOMS_API_URL` | Value: `https://api.sevenrooms.com` (or your endpoint)
   - [ ] Click "Save" at the top
   - [ ] Click "Continue" if prompted to restart

## Deployment

- [ ] Push to `main` branch:
  ```bash
  git add .
  git commit -m "Deploy to Azure"
  git push origin main
  ```
- [ ] Go to GitHub → Actions tab
- [ ] Watch the workflow run:
  - Checkout ✅
  - Setup Node ✅
  - Install dependencies ✅
  - Run tests ✅
  - Build TypeScript ✅
  - Deploy to Azure ✅

## Post-Deployment Verification

- [ ] In Azure portal, check Web App status (should be "Running")
- [ ] Check "Application Insights" (if enabled) for any errors
- [ ] View logs: Web App → Log Stream (watch for startup messages)

## Testing the Deployed Server

Since the server uses STDIO (not HTTP), you'll test it via an MCP client:

1. **With Claude for Desktop** (recommended):
   ```json
   // Edit ~/Library/Application Support/Claude/claude_desktop_config.json (macOS)
   // or %APPDATA%/Claude/claude_desktop_config.json (Windows)
   {
     "mcpServers": {
       "sevenroom": {
         "command": "node",
         "args": ["/path/to/build/index.js"],
         "env": {
           "SEVENROOMS_API_KEY": "your_key",
           "SEVENROOMS_API_URL": "https://api.sevenrooms.com"
         }
       }
     }
   }
   ```

2. **Testing Tool Invocation**:
   - Ask Claude: "Make a reservation for 4 people on 2025-12-25 at 19:00 for John Doe"
   - Claude will invoke the `make_reservations` tool
   - Check the response for reservation confirmation

3. **Testing Resource Access**:
   - Ask Claude: "What times are available on 2025-12-25 for 4 people around 19:00?"
   - Claude will access the `available_time_slot` resource
   - Check the response for available times (only 'book' type)

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Workflow fails on "Deploy to Azure" | Verify `AZURE_WEBAPP_PUBLISH_PROFILE` secret has full XML content (no truncation) |
| App crashes after deployment | Check Web App → Log Stream for error messages; verify env vars are set in Configuration |
| Server not responding to MCP client | Ensure the MCP client is pointing to the correct server path and has correct env vars configured |
| Tests fail locally but pass in CI | Run `npm install` and `npm test` again; check Node version (`node --version` should be >= 16) |
| Build fails with TypeScript errors | Run `npm run build` locally; fix errors before pushing |

## Rolling Back

If deployment fails:

1. Go to Azure portal → Web App → Deployment slots (or Deployments)
2. Click "Rollback" to previous working version
3. Or re-deploy by pushing a known-good commit to `main`

## Monitoring

After deployment:

- [ ] Check Web App → Application Insights for error rates
- [ ] Set up alerts for HTTP 5xx errors
- [ ] Monitor Azure costs (check pricing for your tier)
- [ ] Review logs weekly for performance issues

## Updating

To update the server:

1. Edit `src/index.ts`
2. Run `npm test` locally
3. Run `npm run build` locally
4. Commit and push to `main`
5. GitHub Actions deploys automatically

## Support

- **MCP Documentation:** https://modelcontextprotocol.io/
- **Azure App Service:** https://docs.microsoft.com/azure/app-service/
- **SevenRooms API:** https://sevenrooms.com/developers/

---

**Status:** Ready for deployment  
**Updated:** November 20, 2025
