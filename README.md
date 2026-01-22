# Business Tracker

**A comprehensive multi-level business performance tracking and management system for FGR & Mono Digital**

## 🔗 Links

- **GitHub Repository**: https://github.com/amper8and/business-tracker-v1
- **Production (Cloudflare Pages)**: https://business-tracker-v1.pages.dev
- **Latest Deployment**: https://ec51687c.business-tracker-v1.pages.dev
- **Development Preview**: https://3000-ihq1genwp02izdwzy8ojc-6532622b.e2b.dev

## 📦 Current Version: **v1.0**
- **Status**: ✅ Live on Cloudflare Pages
- **Production URL**: https://business-tracker-v1.pages.dev
- **Latest Features**: 
  - ✅ Local Mastery Tables (no Google Sheets dependency)
  - ✅ Course Library with 20 pre-loaded courses
  - ✅ Performance Dashboard with filters and charts
  - ✅ Total Hours tracking for course completion
  - ✅ Complete user management system
- **Last Deployed**: January 18, 2026

## 🎯 Project Overview

Business Tracker is a sophisticated web application designed to support the execution of the 2026 business strategy for FGR and Mono Digital. It provides a three-level hierarchical view of business performance across 6 key capabilities:

1. **Stakeholder Engagement**
2. **Business Development** 
3. **Product Planning**
4. **Marketing Campaigns**
5. **Performance Tracking**
6. **Mastery & Learning**

## 🚀 Live Demo

**Preview URL**: https://3000-ihq1genwp02izdwzy8ojc-6532622b.e2b.dev

### Test Credentials

- **Admin**: Username: `Pelayo` | Password: `password123`
- **Lead**: Username: `Charlotte` | Password: `password123`
- **User**: Username: `Vambai` | Password: `password123`

## ✨ Key Features

### Level 1: Business Review Scorecard
- **Real-time Dashboard** - Visual overview of all 6 business capabilities
- **Role-based Views** - Different perspectives for Users, Leads, and Admins
- **Performance KPIs** - MTD Revenue, Run Rate, Subscriber Base, Daily Revenue
- **Mastery Statistics** - Learning hours breakdown by category (Function, Technology, Leadership, Compliance)
- **Activity Status** - On-track, in-progress, and off-track percentages for each capability

### Level 2: Detailed Views

#### Mastery & Learning Management
- **Two-Table Architecture**: 
  - **Course Activity Table**: Track user course progress (main table)
  - **Course Library**: Master list of all available courses (admin-managed)
- **20 Pre-loaded Courses**: Across Compliance, Function, Leadership, and Technology categories
- **Course Filtering**: Course dropdown filters by selected category
- **Total Hours Tracking**: Each course has configurable hours (default: 4 hours)
- **Dynamic Hours Calculation**: Scorecard updates based on completion % × course hours
- **Filtering** - By username and business category
- **CRUD Operations** - Add, edit, and delete course records with proper permissions
- **Progress Tracking** - Initiation, updates, and completion dates
- **Role-based Access** - Users see only their courses, Leads see their team, Admins see all

#### Performance Dashboard
- **Integrated Dashboard**: Based on service-performance-dashboard GitHub repo
- **Filter Bar**: Category, Service, Month filters with "Show Target to Date" toggle
- **KPI Cards**: MTD Revenue, Run Rate, Subscriber Base, Revenue Today (all dynamic)
- **Interactive Charts**: 
  - MTD Revenue vs Target (line chart with cumulative data)
  - Daily Run Rate (shows daily revenue vs target)
- **Detailed Table**: Service-level breakdown with variance calculations
- **Export Ready**: CSV export button (placeholder for full implementation)

#### Kanban Activity Board
- **Drag-and-Drop** - Move activities between lanes (Planned, In Progress, Completed, Paused)
- **Color-coded Cards** - Visual distinction by capability
- **Rich Metadata** - Owner, dates, status indicators, comments
- **Advanced Filtering** - By capability, lane, business category, and owner
- **Auto-calculations** - Days active, overdue indicators
- **Role-based Editing** - Users edit only their cards, Admins edit all

### User Management
- **Authentication** - Google Sheets-based login
- **Password Management** - Users can change their own passwords
- **Last Login Tracking** - Automatic timestamp updates
- **User Types**: 
  - **User** - Individual contributor view
  - **Lead** - Team/category view
  - **Admin** - Full system access

## 🏗️ Technical Architecture

### Frontend
- **Pure JavaScript** - No framework dependencies, lightweight and fast
- **Responsive Design** - Works on desktop and mobile devices
- **Modern UI/UX** - Clean pastel design inspired by Uber and Airbnb
- **Typography** - Ubuntu for headings, Inter for body text

### Backend
- **Hono Framework** - Lightweight, fast web framework for Cloudflare Workers
- **Cloudflare Pages** - Deployed on Cloudflare's edge network
- **localStorage** - Client-side data persistence for Mastery and Kanban
- **Session Management** - Browser session storage for authenticated users

### Data Storage
- **Users**: localStorage (initialized from sample data)
- **Mastery Course Library**: localStorage (20 pre-loaded courses)
- **Mastery Course Activity**: localStorage (user progress tracking)
- **Kanban Activities**: localStorage (activity board data)
- **Performance Data**: localStorage with version flag (persistent, no auto-regeneration)

### Data Persistence Architecture

#### 🔒 Permanent Data Guarantee
This is a **live production system**. All data changes are **permanent and persistent**:

1. **Version-Controlled Persistence**
   - Each data save includes a `drumtree_data_version` flag in localStorage
   - Once initialized, the system will **NEVER** automatically regenerate data
   - Sample data only appears on the very first initialization (when no data exists and no version flag)

2. **Three-Stage Initialization**
   - **Stage 1 (First Launch)**: No data and no version flag → Generates sample data and sets version flag
   - **Stage 2 (Subsequent Launches)**: Data exists → Loads existing data (no regeneration)
   - **Stage 3 (Data Cleared)**: Version flag exists but no data → Initializes empty structure (no sample data)

3. **What Happens on Code Updates**
   - ✅ Your data is preserved across all functionality updates
   - ✅ localStorage data is separate from application code
   - ✅ Version flag prevents accidental data regeneration
   - ✅ All edits made through the UI are permanent

4. **Data Safety Mechanisms**
   - Every save operation updates the version flag
   - Data validation before saving
   - Console logging for all data operations
   - Export/import utilities for backup and restore

#### 🛠️ Admin Data Management Utilities

Admins can access these functions via the **browser console** (F12 → Console tab):

```javascript
// Export complete data backup to JSON file
App.exportDataBackup()

// Import data from backup file
// First, read the file, then:
App.importDataBackup(jsonData)

// Clear all data (requires confirmation)
// ⚠️ WARNING: This permanently deletes all data!
App.clearAllData()

// Reset data version flag (advanced use only)
// This allows regeneration if ALL data is cleared
App.resetDataVersion()
```

#### 📦 Data Export/Import Workflow

**To Create a Backup:**
1. Login as Admin
2. Open browser console (F12)
3. Run: `App.exportDataBackup()`
4. Save the downloaded JSON file (e.g., `drumtree-backup-2026-01-22.json`)

**To Restore from Backup:**
1. Login as Admin
2. Open browser console (F12)
3. Load your backup JSON file into a variable:
   ```javascript
   const backupData = { /* paste your JSON here */ }
   App.importDataBackup(backupData)
   ```
4. System will reload with restored data

#### ⚠️ Important Notes

- **localStorage is browser-specific**: Data is stored per browser/device. Use export/import to move data between browsers.
- **Browser cache clearing**: If you clear browser cache/localStorage, you must restore from backup.
- **Production safeguard**: Once the system is initialized with real data, it will never auto-regenerate.
- **Recommended practice**: Export backups regularly, especially before major updates.

## 📊 Data Models

### User Model
```typescript
{
  username: string
  password: string
  name: string
  type: 'User' | 'Lead' | 'Admin'
  contentBusiness: boolean
  channelBusiness: boolean
  lastLogin: datetime
}
```

### Course Model (Activity)
```typescript
{
  id: string
  username: string
  category: 'Compliance' | 'Function' | 'Leadership' | 'Technology'
  course: string (selected from Course Library)
  completion: number (0-100)
  initiated: date
  updated: date
  concluded: date
  createdBy: string
  createdAt: datetime
}
```

### Course Model (Library)
```typescript
{
  id: string
  name: string
  category: 'Compliance' | 'Function' | 'Leadership' | 'Technology'
  url: string (optional - link to course)
  hours: number (default 4, min 0.5, step 0.5)
}
```

### Performance Service Model
```typescript
{
  name: string
  category: 'Content Business' | 'Channel Business'
  mtdRevenue: number
  mtdTarget: number
  actualRunRate: number
  requiredRunRate: number
  subscriberBase: number
  dailyData: Array<{
    day: number
    date: string
    revenue: number
    target: number
  }>
}
```

### Activity Card Model
```typescript
{
  id: string
  name: string
  capability: string
  owner: string
  category: 'Content' | 'Channel'
  startDate: date
  targetDate: date
  status: 'green' | 'amber' | 'red'
  lane: 'Planned' | 'In Progress' | 'Completed' | 'Paused'
  comments: string
}
```

## 🎨 Design System

### Color Palette (Pastel)
- **Primary**: #667eea (Indigo)
- **Stakeholder Engagement**: #a8dadc (Light Blue)
- **Business Development**: #f4a261 (Peach)
- **Product Planning**: #e9c46a (Yellow)
- **Marketing Campaigns**: #e76f51 (Coral)
- **Performance**: #2a9d8f (Teal)
- **Mastery**: #9b5de5 (Purple)

### Status Colors
- **Green**: On Track (#52c41a)
- **Amber**: At Risk (#faad14)
- **Red**: Off Track (#f5222d)

## 🚀 Development

### Prerequisites
- Node.js 18+
- npm or yarn
- PM2 (for local development)

### Installation
```bash
# Clone the repository
git clone https://github.com/amper8and/business-tracker-v1.git
cd business-tracker-v1

# Install dependencies
npm install

# Build the application
npm run build

# Start development server with PM2
pm2 start ecosystem.config.cjs

# View logs
pm2 logs drumtree-tracker --nostream

# Stop server
pm2 stop drumtree-tracker
```

### Development Scripts
```bash
npm run dev              # Vite dev server
npm run dev:sandbox      # Wrangler dev server for Cloudflare
npm run build            # Build for production
npm run preview          # Preview production build
npm run deploy           # Deploy to Cloudflare Pages
npm run deploy:prod      # Deploy with project name
npm run clean-port       # Kill processes on port 3000
npm run test             # Test local server
```

### Project Structure
```
webapp/
├── src/
│   ├── index.tsx          # Hono backend entry point
│   └── renderer.tsx       # React renderer (not used in final version)
├── public/
│   ├── index.html         # Main HTML file
│   └── static/
│       ├── app.js         # Frontend JavaScript application
│       └── style.css      # CSS styles
├── ecosystem.config.cjs   # PM2 configuration
├── package.json          # Dependencies and scripts
├── vite.config.ts        # Vite configuration
├── wrangler.jsonc        # Cloudflare configuration
└── README.md             # This file
```

## 🔒 Security & Access Control

### Authentication
- Username/password authentication via Google Sheets
- Session-based authentication using sessionStorage
- Automatic logout on session expiration

### Authorization Levels

#### User (Type = "User")
- View only own courses and activities
- Edit only own activities
- Limited to assigned business category

#### Lead (Type = "Lead")
- View all courses and activities in assigned business category
- Create activities for team members
- Edit team activities within category
- Cannot access other categories

#### Admin (Type = "Admin")
- Full system access
- View and edit all data
- Manage all users and activities
- Access all business categories

## 📈 Current Status

### ✅ Completed Features
1. **Authentication System** - Local user management with password change functionality
2. **Level 1 Scorecard** - All 6 capability boxes with real-time data
3. **Mastery Management** - Two-table system with Course Library (20 courses) and Activity tracking
4. **Course Library** - Admin-managed master course list with hours tracking
5. **Performance Dashboard** - Full dashboard with filters, KPIs, charts, and detail table
6. **Kanban Board** - Full drag-and-drop functionality with filtering
7. **Role-based Access Control** - User, Lead, Admin permissions
8. **Responsive Design** - Mobile and desktop support
9. **Dynamic Hours Calculation** - Scorecard updates based on course hours × completion %

### 🚧 Future Enhancements
1. **Google Sheets Integration** - Connect to live Google Sheets data sources
2. **Real-time Sync** - Auto-update data from external APIs
3. **Email Notifications** - Alerts for overdue activities
4. **Data Export** - Complete CSV/Excel export functionality
5. **Advanced Analytics** - Trend charts and historical comparisons
6. **Level 3 Planners** - Detailed planning views for each capability

### 🎯 Recommended Next Steps
1. Deploy to Cloudflare Pages for production hosting
2. Connect to live data sources (Google Sheets or APIs)
3. Implement email notifications for overdue activities
4. Add data export functionality (CSV/Excel)
5. Build advanced analytics and trend visualizations
6. Implement Level 3 planners for detailed capability planning

## 🚢 Deployment

### Cloudflare Pages (Recommended)

This project is designed for **Cloudflare Pages** deployment (not GitHub Pages) because it uses:
- Hono framework with server-side routing
- Dynamic API endpoints
- Edge computing capabilities

#### Prerequisites
1. Cloudflare account (free tier works)
2. Cloudflare API token with Pages permissions

#### Setup Cloudflare API Key
```bash
# In your GenSpark environment, run:
# Call setup_cloudflare_api_key tool

# Or manually set in your Cloudflare dashboard:
# Account > API Tokens > Create Token > Edit Cloudflare Pages
```

#### Deploy to Cloudflare Pages
```bash
# Build for production
npm run build

# Create Cloudflare Pages project (first time only)
npx wrangler pages project create business-tracker-v1 \
  --production-branch main \
  --compatibility-date 2026-01-15

# Deploy to Cloudflare Pages
npx wrangler pages deploy dist --project-name business-tracker-v1

# Your app will be live at:
# https://business-tracker-v1.pages.dev
```

#### Subsequent Deployments
```bash
# Build and deploy in one command
npm run build
npx wrangler pages deploy dist --project-name business-tracker-v1
```

### GitHub Pages (Not Recommended)

⚠️ **Note**: GitHub Pages only supports static sites without server-side logic. This project uses Hono with server-side routing and won't work on GitHub Pages. Use Cloudflare Pages instead.

### Environment Variables
No environment variables required for basic functionality. All data is stored in localStorage.

For future integrations:
- `GOOGLE_SHEETS_API_KEY` - For Google Sheets integration
- `GOOGLE_APPS_SCRIPT_URL` - For sheet write-back functionality

## 📖 User Guide

### For Users
1. **Login** - Use your assigned username and password
2. **View Scorecard** - See your personal performance metrics
3. **Track Learning** - Add and update your course progress
4. **Manage Activities** - Create and track your assigned activities
5. **Update Status** - Drag activities between lanes as you progress

### For Leads
1. **Monitor Team** - View all team activities and courses
2. **Assign Activities** - Create new activities for team members
3. **Track Progress** - Monitor team learning and activity completion
4. **Filter Views** - Use filters to focus on specific areas

### For Admins
1. **System Overview** - Full visibility across all categories
2. **Manage All Data** - Edit any activity or course
3. **Monitor Performance** - Track organization-wide metrics
4. **Support Users** - Assist with data entry and corrections

## 🤝 Contributing

This is a project for FGR & Mono Digital. Contributions and suggestions are welcome!

## 📄 License

MIT License - See LICENSE file for details

## 📞 Support

For technical support or feature requests, please:
- Open an issue on GitHub: https://github.com/amper8and/business-tracker-v1/issues
- Contact the development team

---

**Last Updated**: January 18, 2026  
**Version**: 1.0  
**Status**: ✅ Production Ready  
**GitHub**: https://github.com/amper8and/business-tracker-v1
