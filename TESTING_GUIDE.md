# DrumTree Business Tracker - Testing Guide

## 🧪 Testing the Application

### Access the Live Preview
**URL**: https://3000-ihq1genwp02izdwzy8ojc-6532622b.e2b.dev

### Test Scenarios

#### 1. Authentication & Login
- **Test Login**: The app uses your Google Sheets for authentication
- **Expected Sheet Structure**:
  - Column A: Username
  - Column B: Password  
  - Column C: Name
  - Column D: Type (User/Lead/Admin)
  - Column E: Content Business (yes/no)
  - Column F: Channel Business (yes/no)
  - Column G: Last Login

**Test Cases**:
- ✅ Login with valid credentials
- ✅ Login with invalid credentials (should show error)
- ✅ Change password functionality
- ✅ Logout functionality

#### 2. Level 1: Business Review Scorecard
**What to Test**:
- ✅ All 6 capability boxes are visible and clickable
- ✅ Performance KPIs show data (MTD Revenue, Run Rate, Total Base, Revenue Today)
- ✅ Mastery stats show learning hours by category
- ✅ Each capability box shows percentage breakdown (On Track, In Progress, Off Track)

**User Type Tests**:
- **User**: Should see only their own data
- **Lead**: Should see their business category (Content or Channel)
- **Admin**: Should see all data

#### 3. Level 2: Mastery & Learning

**Navigation**:
- Click on the "Mastery" box at the bottom of the scorecard

**What to Test**:
- ✅ Table displays courses with correct columns
- ✅ Filter by username works
- ✅ Filter by business category works
- ✅ Add new course opens modal
- ✅ Edit course loads data correctly
- ✅ Delete course removes from table
- ✅ Validation: completion > 0 requires initiated date
- ✅ Validation: completion = 100 requires concluded date

**User Type Tests**:
- **User**: Can only see/edit own courses, username filter disabled
- **Lead**: Can see team courses in assigned category
- **Admin**: Can see/edit all courses

#### 4. Level 2: Performance Dashboard

**Navigation**:
- Click on the "Performance" box in the middle of the scorecard

**What to Test**:
- ✅ Placeholder message displays
- ✅ Link to existing dashboard is shown
- ✅ Back button returns to scorecard

**Note**: Full integration pending - this is a placeholder for the existing performance dashboard.

#### 5. Level 2: Kanban Board

**Navigation**:
- Click on any of the 4 capability boxes at the top:
  - Stakeholder Engagement
  - Business Development
  - Product Planning
  - Marketing Campaigns

**What to Test**:
- ✅ 4 lanes display: Planned, In Progress, Completed, Paused
- ✅ Sample cards are visible
- ✅ Cards are color-coded by capability
- ✅ Drag and drop between lanes works
- ✅ Click card to edit opens modal
- ✅ Add activity button opens modal
- ✅ Status indicators (green, amber, red) display correctly
- ✅ Days active calculation shows correctly
- ✅ Overdue indicator shows for past-due activities

**Filter Tests**:
- ✅ Capability filter works (select one or multiple)
- ✅ Lanes filter works (hide specific lanes)
- ✅ Business Category filter works
- ✅ Owner filter works
- ✅ Multiple filters work together

**Card Operations**:
- ✅ Create new activity card
- ✅ Edit existing activity card
- ✅ Delete activity card (with confirmation)
- ✅ Move card between lanes via drag-and-drop
- ✅ Status auto-updates when moved to Completed

**User Type Tests**:
- **User**: Can only create/edit/move own cards, filtered by username
- **Lead**: Can create/edit cards in assigned category
- **Admin**: Can create/edit/move any card

#### 6. Modals & Forms

**Change Password Modal**:
- ✅ Opens from header button
- ✅ Validates current password
- ✅ Validates new password match
- ✅ Validates minimum password length
- ✅ Shows success message
- ✅ Close button works

**Course Modal**:
- ✅ Opens in add mode (empty fields)
- ✅ Opens in edit mode (pre-filled fields)
- ✅ Username dropdown populates correctly
- ✅ Category dropdown has all 4 categories
- ✅ Validation messages display
- ✅ Save updates the table
- ✅ Cancel closes without saving

**Activity Card Modal**:
- ✅ Opens in add mode (empty fields, no delete button)
- ✅ Opens in edit mode (pre-filled, delete button visible)
- ✅ Owner dropdown populates based on user type
- ✅ All fields save correctly
- ✅ Comments field allows multi-line text
- ✅ Delete button removes card (with confirmation)

#### 7. Role-Based Access Control

**As User**:
- ✅ See only own mastery courses
- ✅ See only own kanban activities  
- ✅ Cannot edit others' data
- ✅ Username filters are pre-set and disabled

**As Lead**:
- ✅ See all courses/activities in assigned category
- ✅ Can create activities for team members
- ✅ Business category filter pre-set
- ✅ Can edit team data within category

**As Admin**:
- ✅ See all data across all categories
- ✅ Can edit any course or activity
- ✅ No restrictions on filters
- ✅ Full system access

#### 8. UI/UX & Responsiveness

**Desktop View**:
- ✅ Scorecard displays in proper grid (4-1-1 layout)
- ✅ Tables are readable and scrollable
- ✅ Modals are centered and sized appropriately
- ✅ Kanban lanes display side-by-side

**Tablet View** (768px - 1024px):
- ✅ Scorecard adjusts to 2-column grid for capabilities
- ✅ Tables remain functional
- ✅ Modals adjust size

**Mobile View** (< 768px):
- ✅ Scorecard stacks vertically (1 column)
- ✅ Header adjusts layout
- ✅ Filters stack vertically
- ✅ Kanban lanes stack vertically
- ✅ Forms remain usable

#### 9. Data Persistence

**Session Storage**:
- ✅ Login persists on page refresh
- ✅ Logout clears session

**Local Storage** (Kanban cards):
- ✅ Activities persist on page refresh
- ✅ Changes save immediately
- ✅ Drag-and-drop updates save

**Google Sheets** (Users & Mastery):
- ⚠️ Currently read-only
- ⚠️ Write-back requires Apps Script (pending)

#### 10. Performance

**Load Times**:
- ✅ Initial page load < 2 seconds
- ✅ Google Sheets fetch < 3 seconds
- ✅ Navigation between levels instant
- ✅ Modal open/close animations smooth

**Browser Compatibility**:
- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari
- ✅ Mobile browsers

## 🐛 Known Issues & Limitations

### Current Limitations
1. **Google Sheets Write-back**: Changes to mastery courses and user data don't persist to Google Sheets yet (requires Apps Script deployment)
2. **Performance Dashboard**: Placeholder only - full integration pending
3. **Level 3 Planners**: Buttons inactive (future feature)
4. **Last Login**: Not updating in Google Sheets yet
5. **Kanban Persistence**: Using localStorage instead of Google Sheets

### Workarounds
- **For Testing Mastery**: Changes persist in browser session, cleared on logout
- **For Testing Kanban**: Activities stored in localStorage, persist across sessions
- **For Production**: Deploy Google Apps Script web app for sheet write-back

## 📝 Test Data

### Sample User Accounts
You'll need to create test users in your Google Sheet:

```
Username | Password | Name | Type | Content Business | Channel Business
admin | admin123 | Admin User | Admin | yes | yes
lead1 | lead123 | Content Lead | Lead | yes | no
lead2 | lead456 | Channel Lead | Lead | no | yes
user1 | user123 | John Doe | User | yes | no
user2 | user456 | Jane Smith | User | no | yes
```

### Sample Courses
The app will generate sample data, but you can also populate your Mastery sheet:

```
Username | Category | Course | % Completion | Initiated | Updated | Concluded
user1 | Technology | React Fundamentals | 75 | 2026-01-01 | 2026-01-15 |
user1 | Function | Business Analysis | 100 | 2025-12-01 | 2026-01-15 | 2026-01-15
```

### Sample Activities
The app generates 3 sample kanban activities on first load.

## ✅ Testing Checklist

### Before Declaring "Ready for Production"
- [ ] All authentication scenarios tested
- [ ] All 3 user types tested (User, Lead, Admin)
- [ ] All CRUD operations tested (Create, Read, Update, Delete)
- [ ] All filters tested
- [ ] Drag-and-drop tested across all lanes
- [ ] Modals tested (open, save, cancel, close)
- [ ] Responsive design tested on multiple devices
- [ ] Browser compatibility confirmed
- [ ] Google Sheets integration verified
- [ ] Apps Script deployed for write-back
- [ ] Performance dashboard integrated
- [ ] Data validation confirmed
- [ ] Error handling tested
- [ ] Security permissions verified

### Deployment Checklist
- [ ] Build succeeds without errors
- [ ] All static assets load correctly
- [ ] Google Sheets URLs are correct
- [ ] Environment variables set (if needed)
- [ ] HTTPS enabled
- [ ] Domain configured (if using custom domain)
- [ ] User acceptance testing completed
- [ ] Documentation updated
- [ ] Training materials prepared
- [ ] Support contacts identified

## 🚀 Next Steps After Testing

1. **Gather Feedback**: Test with real users from each role type
2. **Fix Bugs**: Address any issues found during testing
3. **Deploy Apps Script**: Enable write-back to Google Sheets
4. **Integrate Performance Dashboard**: Complete the dashboard integration
5. **Deploy to Production**: Move from preview to production URL
6. **Train Users**: Conduct training sessions for each user type
7. **Monitor Usage**: Track adoption and gather feedback
8. **Iterate**: Plan next features based on user feedback

## 📞 Support During Testing

For issues or questions during testing:
- Check browser console for error messages
- Verify Google Sheets are accessible and properly structured
- Ensure user account has correct permissions
- Try clearing browser cache and localStorage
- Test in incognito/private mode to rule out cache issues

---

**Testing Started**: January 15, 2026  
**Tester**: _____________  
**Test Environment**: Preview (Sandbox)  
**Expected Completion**: _____________
