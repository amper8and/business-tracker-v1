# DrumTree Business Tracker

**A comprehensive multi-level business performance tracking and management system for FGR & Mono Digital**

## 🎯 Project Overview

DrumTree Business Tracker is a sophisticated web application designed to support the execution of the 2026 business strategy for FGR and Mono Digital. It provides a three-level hierarchical view of business performance across 6 key capabilities:

1. **Stakeholder Engagement**
2. **Business Development** 
3. **Product Planning**
4. **Marketing Campaigns**
5. **Performance Tracking**
6. **Mastery & Learning**

## 🚀 Live Demo

**Preview URL**: https://3000-ihq1genwp02izdwzy8ojc-6532622b.e2b.dev

### Test Credentials

The application uses Google Sheets for authentication. You can test with the users configured in your Users sheet:
- Sheet URL: https://docs.google.com/spreadsheets/d/1ftPlrOVjAt1V4H9dSRN3ptHYJJemoNLiheSRG4QtBr0

## ✨ Key Features

### Level 1: Business Review Scorecard
- **Real-time Dashboard** - Visual overview of all 6 business capabilities
- **Role-based Views** - Different perspectives for Users, Leads, and Admins
- **Performance KPIs** - MTD Revenue, Run Rate, Subscriber Base, Daily Revenue
- **Mastery Statistics** - Learning hours breakdown by category (Function, Technology, Leadership, Compliance)
- **Activity Status** - On-track, in-progress, and off-track percentages for each capability

### Level 2: Detailed Views

#### Mastery & Learning Management
- **Course Tracking** - Track training progress across the organization
- **Filtering** - By username and business category
- **CRUD Operations** - Add, edit, and delete course records
- **Progress Tracking** - Initiation, updates, and completion dates
- **Role-based Access** - Users see only their courses, Leads see their team, Admins see all

#### Performance Dashboard
- Integrated performance metrics dashboard
- Based on existing service performance tracker
- Real-time revenue and subscriber tracking

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
- **Static Site Architecture** - Deployed as a static site for optimal performance
- **Google Sheets Integration** - Real-time data sync with Google Sheets
- **Session Management** - Browser session storage for authenticated users

### Data Sources
- **Users**: https://docs.google.com/spreadsheets/d/1ftPlrOVjAt1V4H9dSRN3ptHYJJemoNLiheSRG4QtBr0
- **Mastery Data**: https://docs.google.com/spreadsheets/d/1ZuXWFgJu5PMcoa7q74nh_C5pEpoLzYNzHQ-cMxUyL9I
- **Performance Data**: https://docs.google.com/spreadsheets/d/1851AkYrs6SIS63X51yVFfP_7l7EcLBUiiJgYn74XXMI
- **Kanban Data**: Local storage (for demo), can be integrated with Google Sheets

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

### Course Model
```typescript
{
  username: string
  category: 'Compliance' | 'Function' | 'Leadership' | 'Technology'
  course: string
  completion: number (0-100)
  initiated: date
  updated: date
  concluded: date
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
git clone <your-repo-url>
cd webapp

# Install dependencies
npm install

# Build the application
npm run build

# Start development server
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
1. **Authentication System** - Google Sheets integration, password change functionality
2. **Level 1 Scorecard** - All 6 capability boxes with real-time data
3. **Mastery Management** - Course tracking with CRUD operations
4. **Kanban Board** - Full drag-and-drop functionality with filtering
5. **Role-based Access Control** - User, Lead, Admin permissions
6. **Responsive Design** - Mobile and desktop support
7. **Data Integration** - Google Sheets API integration

### 🚧 Pending Integrations
1. **Performance Dashboard** - Full integration with existing dashboard (currently placeholder)
2. **Google Sheets Write-back** - Apps Script for updating sheets (currently local storage)
3. **Last Login Updates** - Automatic timestamp updates to Users sheet
4. **Level 3 Planners** - Inactive buttons ready for future implementation

### 🎯 Recommended Next Steps
1. Create Google Apps Script web app for sheet write-back
2. Integrate full performance dashboard from existing repo
3. Add data export functionality (CSV/Excel)
4. Implement email notifications for overdue activities
5. Add data visualization charts for trends
6. Build Level 3 planners for each capability

## 🚢 Deployment

### Option 1: Cloudflare Pages (Recommended)
```bash
# Build for production
npm run build

# Deploy to Cloudflare Pages
npm run deploy:prod

# Will be available at: https://drumtree-tracker.pages.dev
```

### Option 2: GitHub Pages
```bash
# Build for production
npm run build

# Copy dist/ contents to gh-pages branch
# Configure GitHub Pages to serve from gh-pages branch
```

### Environment Variables
No environment variables required for basic functionality. For production Google Sheets write-back, you'll need:
- `GOOGLE_APPS_SCRIPT_URL` - URL of deployed Apps Script web app

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

This is an internal tool for FGR & Mono Digital. For questions or issues, contact the development team.

## 📄 License

Proprietary - FGR & Mono Digital

## 📞 Support

For technical support or feature requests, please contact:
- **Project Lead**: TBD
- **Development Team**: TBD

---

**Last Updated**: January 15, 2026  
**Version**: 1.0  
**Status**: ✅ Active - Preview Available
