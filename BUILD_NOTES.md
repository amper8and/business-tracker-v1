# Build History

## Build 0.1 - Stable Baseline
**Date**: 2026-01-15  
**Git Tag**: `v0.1-build`  
**Backup**: [drumtree-build-0.1.tar.gz](https://www.genspark.ai/api/files/s/akrx0liP)  
**Commit**: `6a5785a`

### ✅ Working Features
- **Authentication & Security**
  - Google Sheets-based login (credentials from UserID sheet)
  - Password change functionality
  - Session persistence
  - Role-based access control (User, Lead, Admin)
  
- **Level 1: Business Review Scorecard**
  - 6 capability boxes with live stats
  - Performance KPIs (MTD Revenue, Run Rate, Total Base, Revenue Today)
  - Mastery learning hours by category
  - Activity status tracking (% on track/in progress/off track)
  
- **Level 2: Mastery & Learning Management**
  - Full CRUD operations on learning records
  - Filtered by user role (User: own records, Lead: team records, Admin: all)
  - Filters: Username, Business Category (Content/Channel)
  - Auto-date validation for Initiated/Updated/Concluded
  - Completion % tracking
  
- **Level 2: Kanban Activity Board**
  - Drag & drop cards between lanes (Planned, In Progress, Completed, Paused)
  - Color-coded by capability
  - Rich metadata (Owner, Category, Dates, Status, Comments)
  - Advanced filtering (Capability, Lane, Category, Owner)
  - Role-based CRUD (Users: own cards, Admin: all cards)
  - Auto-calculated days active
  - Status indicators (green/amber)
  
- **Design & UX**
  - Ubuntu font (headings) + Inter font (body)
  - Pastel color palette
  - Responsive layout
  - Smooth animations
  - Modal dialogs
  - Sortable tables

### 🔗 Google Sheets Integration
- **Users Sheet**: https://docs.google.com/spreadsheets/d/1ftPlrOVjAt1V4H9dSRN3ptHYJJemoNLiheSRG4QtBr0
  - Column0: Username
  - Column1: Password
  - Column2: Type (Admin/Lead/User)
  - Column3: Content (Yes/No)
  - Column4: Channel (Yes/No)
  - Column5: Last Login
  
- **Mastery Sheet**: https://docs.google.com/spreadsheets/d/1ZuXWFgJu5PMcoa7q74nh_C5pEpoLzYNzHQ-cMxUyL9I
  
- **Performance Sheet**: https://docs.google.com/spreadsheets/d/1851AkYrs6SIS63X51yVFfP_7l7EcLBUiiJgYn74XXMI

### 📋 Known Issues Fixed
- ✅ Admin permissions now work correctly (can edit/move/delete any card)
- ✅ User types display correctly (Admin/Lead/User, not "Yes")
- ✅ Owner dropdown shows actual usernames from Google Sheets
- ✅ Column mapping fixed to use Column0-Column5 directly

### 🚧 Pending Features
- Level 2: Full Performance Dashboard integration (currently placeholder)
- Level 3: Planner drill-downs per capability
- Google Sheets write-back (currently read-only with localStorage for demo)
- Last Login timestamp update to Google Sheets
- Export functionality
- Advanced analytics
- Notifications

### 🔄 Restore Instructions
To restore this build:
```bash
# Option 1: Git tag
cd /home/user/webapp
git checkout v0.1-build
npm install
npm run build
pm2 restart drumtree-tracker

# Option 2: Download backup
wget https://www.genspark.ai/api/files/s/akrx0liP -O drumtree-build-0.1.tar.gz
cd /home/user
tar -xzf drumtree-build-0.1.tar.gz
cd webapp
npm install
npm run build
pm2 start ecosystem.config.cjs
```

### 🧪 Test Credentials
Login with any user from the Google Sheet:
- Username: Pelayo (Admin)
- Username: Charlotte (Lead - Content)
- Username: Vambai (Lead - Channel)
- Username: Comfort (User - Content)
- Username: Kudzanai (User - Channel)
- Username: Unesu (Admin)

### 📊 Technical Stack
- **Framework**: Hono (Cloudflare Workers)
- **Build Tool**: Vite
- **Deployment**: Wrangler (Cloudflare Pages)
- **Process Manager**: PM2 (development)
- **Storage**: localStorage (demo), Google Sheets (read)
- **Frontend**: Vanilla JavaScript, CSS3
- **Fonts**: Ubuntu, Inter (Google Fonts)
- **Icons**: Font Awesome 6.4.0

---

## Build History Log

| Build | Date | Tag | Description | Status |
|-------|------|-----|-------------|--------|
| 0.1 | 2026-01-15 | v0.1-build | Stable baseline with core features | ✅ Current |

