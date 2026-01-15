# Quick Restore Guide

## How to Restore Build 0.1 at Any Time

### Method 1: Using Git Tag (Recommended)
```bash
cd /home/user/webapp
git checkout v0.1-build
npm install
npm run build
pm2 restart drumtree-tracker
```

### Method 2: Using Backup File
```bash
# Download the backup
cd /home/user
wget https://www.genspark.ai/api/files/s/akrx0liP -O drumtree-build-0.1.tar.gz

# Extract (this will create /home/user/webapp)
tar -xzf drumtree-build-0.1.tar.gz

# Setup and run
cd webapp
npm install
npm run build
pm2 start ecosystem.config.cjs
```

### Method 3: Using Git Reset (if you're already in the repo)
```bash
cd /home/user/webapp
git reset --hard v0.1-build
npm install
npm run build
pm2 restart drumtree-tracker
```

## Verify Restoration
After restoring, verify the build is working:
```bash
# Check if the service is running
pm2 list

# Test the endpoint
curl http://localhost:3000

# Open in browser
# Visit: https://3000-ihq1genwp02izdwzy8ojc-6532622b.e2b.dev
```

## What's Included in Build 0.1
- ✅ Google Sheets authentication (working)
- ✅ Admin permissions (working)
- ✅ Column mapping (fixed)
- ✅ Level 1 Scorecard (working)
- ✅ Level 2 Mastery Management (working)
- ✅ Level 2 Kanban Board (working)
- ✅ Role-based access control (working)
- ✅ Password change (working)
- ✅ Session persistence (working)

## Build Information
- **Tag**: v0.1-build
- **Commit**: 6a5785a
- **Date**: 2026-01-15
- **Backup URL**: https://www.genspark.ai/api/files/s/akrx0liP
- **Size**: ~235 KB compressed

## Common Issues After Restore

### Issue: "pm2 command not found"
```bash
npm install -g pm2
```

### Issue: Port 3000 already in use
```bash
fuser -k 3000/tcp 2>/dev/null || true
pm2 start ecosystem.config.cjs
```

### Issue: Build fails
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Issue: Changes not reflecting
```bash
# Clear browser cache and localStorage
# In browser console:
localStorage.clear();
sessionStorage.clear();
location.reload();
```

## Testing After Restore
1. Clear browser storage: `localStorage.clear(); sessionStorage.clear(); location.reload()`
2. Login as **Pelayo** (Admin user)
3. Verify header shows "Pelayo (Admin)"
4. Click any capability box
5. Verify Owner dropdown shows real usernames (Charlotte, Comfort, etc.)
6. Test editing/moving cards as Admin
7. Check console for: `isAdmin: true`

## Git Tags Available
```bash
# List all build tags
cd /home/user/webapp
git tag -l

# Current tags:
# v0.1-build              - Build 0.1: Stable baseline
# v1.0-login-working      - Working login state
# v1.1-column-mapping-fix - Column mapping fix
```

## Need Help?
Refer to:
- [BUILD_NOTES.md](BUILD_NOTES.md) - Detailed build history
- [README.md](README.md) - Full project documentation
- [TESTING_GUIDE.md](TESTING_GUIDE.md) - Testing instructions
