# Deployment Guide - DrumTree Business Tracker

## 📋 Pre-Deployment Checklist

Before deploying to GitHub, ensure:
- [x] Application tested and working in preview
- [ ] Google Sheets URLs verified and accessible
- [ ] User accounts set up in Google Sheets
- [ ] Test data populated
- [ ] GitHub repository created
- [ ] GitHub account credentials ready

## 🚀 Deployment Steps

### Step 1: Prepare GitHub Repository

You'll need to provide your GitHub credentials when ready to deploy. We'll use the `setup_github_environment` tool to configure authentication.

### Step 2: Push Code to GitHub

Once GitHub environment is set up:

```bash
cd /home/user/webapp

# Add GitHub remote (replace with your repo URL)
git remote add origin https://github.com/YOUR-USERNAME/drumtree-tracker.git

# Push to main branch
git push -u origin main
```

### Step 3: Configure GitHub Pages

**Option A: GitHub Pages (Simple)**
1. Go to your repository on GitHub
2. Navigate to Settings > Pages
3. Source: Deploy from branch
4. Branch: `main` (or create `gh-pages` branch)
5. Folder: `/dist` or `/docs` (after build)
6. Save

**Option B: Cloudflare Pages (Recommended)**

1. Build for production:
```bash
npm run build
```

2. Deploy to Cloudflare Pages:
```bash
# First time setup
npx wrangler login

# Create Cloudflare Pages project
npx wrangler pages project create drumtree-tracker --production-branch main

# Deploy
npm run deploy:prod
```

3. Your site will be available at: `https://drumtree-tracker.pages.dev`

### Step 4: Verify Deployment

1. Visit your deployed URL
2. Test login with a test account
3. Verify all features work:
   - [ ] Login/logout
   - [ ] Scorecard displays
   - [ ] Mastery table loads
   - [ ] Kanban board works
   - [ ] Drag and drop functions
   - [ ] Modals open/close

### Step 5: Configure Custom Domain (Optional)

**For Cloudflare Pages**:
```bash
npx wrangler pages domain add yourdomain.com --project-name drumtree-tracker
```

**For GitHub Pages**:
1. Settings > Pages > Custom domain
2. Enter your domain
3. Update DNS records at your domain provider

## 🔧 Post-Deployment Tasks

### 1. Set Up Apps Script for Google Sheets Write-back

Create a Google Apps Script web app to enable data persistence:

**Script to create (`Code.gs`)**:
```javascript
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.openById(data.sheetId);
    const sheet = ss.getSheetByName(data.tabName);
    
    if (data.action === 'update') {
      // Update specific row
      const row = data.row;
      const values = data.values;
      sheet.getRange(row, 1, 1, values.length).setValues([values]);
    } else if (data.action === 'append') {
      // Append new row
      sheet.appendRow(data.values);
    } else if (data.action === 'delete') {
      // Delete row
      sheet.deleteRow(data.row);
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({success: true}))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({success: false, error: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

**Deploy as web app**:
1. Save script in Google Apps Script
2. Deploy > New deployment
3. Type: Web app
4. Execute as: Me
5. Who has access: Anyone
6. Deploy
7. Copy the web app URL

**Update application**:
Add the Apps Script URL to your application configuration (in `app.js`, update the `CONFIG` object):
```javascript
const CONFIG = {
  APPS_SCRIPT_URL: 'YOUR_APPS_SCRIPT_WEB_APP_URL',
  // ... rest of config
};
```

### 2. Update Google Sheets Permissions

Ensure all Google Sheets are:
- [ ] Published to the web (File > Share > Publish to web)
- [ ] Sharing settings allow "Anyone with the link" to view
- [ ] Columns match expected structure

### 3. Configure User Accounts

In your Users Google Sheet, set up initial accounts:
1. Admin account for system management
2. Lead accounts for each business category
3. User accounts for team members

### 4. Populate Initial Data

**Mastery Sheet**:
- Add course catalog in "Course" tab
- Set up initial course tracking in "Dashboard" tab

**Performance Sheet**:
- Verify data structure matches dashboard requirements
- Ensure latest data is available

## 🔒 Security Considerations

### Production Checklist
- [ ] Change all default passwords
- [ ] Review user access levels
- [ ] Enable HTTPS (automatic with Cloudflare/GitHub Pages)
- [ ] Set up CORS properly for Apps Script
- [ ] Regularly backup Google Sheets data
- [ ] Monitor for unauthorized access attempts

### Recommended Password Policy
- Minimum 8 characters
- Mix of letters, numbers, and symbols
- Force password change on first login
- Periodic password rotation (90 days)

## 📊 Monitoring & Maintenance

### Weekly Tasks
- [ ] Review user activity logs (check Last Login column)
- [ ] Verify data is syncing correctly
- [ ] Check for any reported issues

### Monthly Tasks
- [ ] Review and update course catalog
- [ ] Archive completed activities
- [ ] Update performance dashboards
- [ ] User access review

### Quarterly Tasks
- [ ] Full security audit
- [ ] Performance optimization
- [ ] Feature usage analysis
- [ ] User feedback collection

## 🆘 Troubleshooting

### Common Issues

**Issue**: Google Sheets data not loading
- **Solution**: Check sheet IDs in CONFIG, verify sheets are published

**Issue**: Login not working
- **Solution**: Verify Users sheet structure, check console for errors

**Issue**: Drag and drop not working
- **Solution**: Clear browser cache, ensure JavaScript enabled

**Issue**: Changes not persisting
- **Solution**: Verify Apps Script is deployed and URL is correct

**Issue**: Performance slow
- **Solution**: Check Google Sheets size, consider data archival

## 📞 Support Contacts

When you're ready to deploy, you can:

1. **Test First**: Use the current preview URL to gather feedback
2. **Deploy When Ready**: Provide GitHub credentials and I'll deploy
3. **Custom Domain**: Let me know if you need a custom domain configured

## 🎯 Deployment Timeline

**Recommended Approach**:
1. **Week 1**: Internal testing with preview URL
2. **Week 2**: User acceptance testing with select users
3. **Week 3**: Apps Script deployment and integration
4. **Week 4**: Production deployment to GitHub/Cloudflare
5. **Week 5**: User training and rollout

## 📝 Deployment Notes

**Current Status**: ✅ Ready for preview testing
**Next Step**: Gather user feedback, then deploy to production
**Estimated Deployment Time**: 15 minutes (once credentials provided)

---

**When you're ready to deploy to GitHub, just let me know and provide**:
- Your GitHub username
- Repository name preference (e.g., "drumtree-tracker")
- Deployment preference (GitHub Pages or Cloudflare Pages)

I'll handle the rest of the deployment process!
