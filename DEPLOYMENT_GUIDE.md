# Deployment Guide - Business Tracker v1

This guide will help you deploy your Business Tracker application to both **GitHub** (code repository) and **Cloudflare Pages** (live hosting).

## ✅ Step 1: GitHub Repository (COMPLETED)

Your code has been successfully pushed to GitHub!

- **Repository URL**: https://github.com/amper8and/business-tracker-v1
- **Branch**: `main`
- **Status**: ✅ All code pushed successfully

### What's on GitHub:
- Complete source code
- All latest features (Performance Dashboard, Mastery Tables, etc.)
- Updated README with documentation
- Git commit history

### To view your code:
1. Visit: https://github.com/amper8and/business-tracker-v1
2. Browse files, view commits, and manage your repository

---

## 🚀 Step 2: Deploy to Cloudflare Pages

Cloudflare Pages is where your app will be **hosted live** for users to access.

### Why Cloudflare Pages (not GitHub Pages)?
- ✅ Supports Hono framework with server-side routing
- ✅ Edge computing for fast global performance
- ✅ Free SSL certificates
- ✅ Automatic deployments from Git
- ✅ Unlimited bandwidth on free tier

GitHub Pages only supports static HTML/CSS/JS and won't work with this application.

### Prerequisites

**You need a Cloudflare API Token:**

1. **Go to Cloudflare Dashboard**:
   - Visit: https://dash.cloudflare.com/profile/api-tokens
   - Log in with your Cloudflare account (or create one - it's free!)

2. **Create API Token**:
   - Click "Create Token"
   - Use the **"Edit Cloudflare Workers"** template OR **"Edit Cloudflare Pages"** template
   - Or create custom token with these permissions:
     - **Account** → **Cloudflare Pages** → **Edit**
   - Click "Continue to summary"
   - Click "Create Token"
   - **COPY THE TOKEN** (you'll only see it once!)

3. **Configure in GenSpark**:
   - Go to the **Deploy** tab in the sidebar
   - Paste your API token
   - Save it

### Deployment Commands

Once your API key is configured, run these commands:

```bash
# 1. Ensure you're in the project directory
cd /home/user/webapp

# 2. Build the production bundle
npm run build

# 3. Create Cloudflare Pages project (FIRST TIME ONLY)
npx wrangler pages project create business-tracker-v1 \
  --production-branch main \
  --compatibility-date 2026-01-15

# 4. Deploy to Cloudflare Pages
npx wrangler pages deploy dist --project-name business-tracker-v1
```

### Expected Output

After successful deployment, you'll see:
```
✨ Success! Uploaded 2 files (X.XX sec)

✨ Deployment complete! Take a peek over at
   https://RANDOM-ID.business-tracker-v1.pages.dev
   
   https://business-tracker-v1.pages.dev
```

### Your Live URLs

After deployment, your app will be available at:
- **Production**: https://business-tracker-v1.pages.dev
- **Deployment URL**: https://[commit-hash].business-tracker-v1.pages.dev

---

## 🔄 Step 3: Future Updates

### Update Your Code

When you make changes and want to deploy updates:

```bash
# 1. Make your code changes
# 2. Build the project
npm run build

# 3. Commit to Git
git add .
git commit -m "Your update message"
git push origin main

# 4. Deploy to Cloudflare
npx wrangler pages deploy dist --project-name business-tracker-v1
```

### Automatic Deployments (Optional)

You can connect your GitHub repo to Cloudflare Pages for automatic deployments:

1. Go to Cloudflare Dashboard: https://dash.cloudflare.com
2. Navigate to **Pages** → **business-tracker-v1**
3. Go to **Settings** → **Builds & deployments**
4. Click **Connect to Git**
5. Select **GitHub** → **business-tracker-v1** repository
6. Configure build settings:
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
7. Save and deploy

Now every push to `main` branch will automatically deploy!

---

## 📋 Deployment Checklist

### GitHub Setup ✅
- [x] Repository created: `business-tracker-v1`
- [x] Code pushed to GitHub
- [x] README updated with documentation
- [x] All commits preserved

### Cloudflare Pages Setup ⏳
- [ ] Cloudflare API token created
- [ ] API token configured in GenSpark Deploy tab
- [ ] Cloudflare Pages project created
- [ ] Application deployed
- [ ] Live URL tested

---

## 🎯 Quick Reference

### Useful Commands

```bash
# Check current git status
cd /home/user/webapp && git status

# View recent commits
git log --oneline -10

# Check git remote
git remote -v

# Build for production
npm run build

# Test local build
npx wrangler pages dev dist

# Deploy to Cloudflare
npx wrangler pages deploy dist --project-name business-tracker-v1

# View Cloudflare Pages info
npx wrangler pages project list
```

### Important URLs

- **GitHub Repo**: https://github.com/amper8and/business-tracker-v1
- **Cloudflare Dashboard**: https://dash.cloudflare.com
- **Cloudflare API Tokens**: https://dash.cloudflare.com/profile/api-tokens
- **Preview (Dev)**: https://3000-ihq1genwp02izdwzy8ojc-6532622b.e2b.dev
- **Production (After Deploy)**: https://business-tracker-v1.pages.dev

---

## ❓ Troubleshooting

### Issue: "Authentication error" during wrangler deploy
**Solution**: 
1. Verify your API token is correct
2. Re-run `setup_cloudflare_api_key` in GenSpark
3. Or manually: `npx wrangler login`

### Issue: "Project already exists"
**Solution**: 
Skip the `pages project create` step and go directly to:
```bash
npx wrangler pages deploy dist --project-name business-tracker-v1
```

### Issue: Build fails
**Solution**:
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Issue: Deploy fails with size error
**Solution**:
Check your `dist/` folder size:
```bash
du -sh dist/
```
Cloudflare Workers have a 10MB limit. Current build should be ~62KB.

---

## 🎉 Success Criteria

Your deployment is successful when:

✅ Code is on GitHub at https://github.com/amper8and/business-tracker-v1
✅ Build completes without errors (`npm run build`)
✅ Deployment completes without errors
✅ You can access the live site at `https://business-tracker-v1.pages.dev`
✅ Login page loads correctly
✅ You can log in with test credentials
✅ All features work (Mastery, Performance, Kanban)

---

## 📞 Support

If you encounter issues:

1. **Check the logs**: Run with `--verbose` flag for detailed output
2. **Verify API token**: Ensure it has correct permissions
3. **Check Cloudflare dashboard**: View deployment status and logs
4. **GitHub Issues**: Open an issue at https://github.com/amper8and/business-tracker-v1/issues

---

**Last Updated**: January 18, 2026  
**Status**: GitHub ✅ Complete | Cloudflare Pages ⏳ Pending API Key Setup
