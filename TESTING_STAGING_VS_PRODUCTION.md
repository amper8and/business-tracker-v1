# Testing Guide: Staging vs Production Environments

## 🔍 Understanding the Two Environments

### 🧪 **Staging Environment (Current Sandbox)**
**URL**: https://3000-iy0c13hbq65mj1ofyswlo-6532622b.e2b.dev/

**Database**: Local SQLite in `.wrangler/state/v3/d1/`
- Stored on the sandbox's ephemeral filesystem
- **Persists**: Only while the sandbox is running
- **Lost when**: Sandbox restarts, times out, or is destroyed
- **Lifetime**: Typically 1 hour of inactivity

**Use Cases**:
- ✅ Testing functionality (create, edit, delete operations)
- ✅ Verifying API endpoints work correctly
- ✅ UI/UX testing
- ✅ Development and debugging
- ❌ Long-term data storage
- ❌ Testing data persistence across days
- ❌ Real business data

### 🚀 **Production Environment (Cloudflare Pages)**
**URL**: https://business-tracker-v1.pages.dev/

**Database**: Cloudflare D1 (globally distributed)
- Stored on Cloudflare's infrastructure
- **Persists**: Permanently (like a real database)
- **Never lost**: Unless you manually delete data
- **Reliability**: Production-grade with automatic backups

**Use Cases**:
- ✅ Real business data
- ✅ Long-term storage
- ✅ Data persistence across days/weeks/months
- ✅ Multi-user production use
- ✅ Testing actual persistence behavior

## 🎯 **Recommendation: Test in Production**

### **Why Production is Better for Testing Persistence**

1. **Real Persistence Behavior**
   - Production uses actual Cloudflare D1 database
   - Data never disappears
   - True representation of how the app will work in real use

2. **Staging Limitations**
   - Local database in sandbox can be wiped
   - Sandbox has limited lifetime (1 hour inactive)
   - Not suitable for testing multi-day workflows

3. **Safe to Test in Production**
   - You can create test data
   - Delete it when done
   - No risk to the production environment
   - Just use test usernames/data you can easily identify

## 📋 **Testing Workflow: Production**

### **Step 1: Deploy to Production**

```bash
# 1. Apply database migration to production
cd /home/user/webapp
npx wrangler d1 migrations apply drumtree-tracker-db --remote

# 2. Build the application
npm run build

# 3. Deploy to Cloudflare Pages
npx wrangler pages deploy dist --project-name business-tracker-v1
```

### **Step 2: Test Kanban Card Persistence in Production**

1. **Go to**: https://business-tracker-v1.pages.dev/

2. **Login** with admin credentials:
   - Username: `Pelayo`
   - Password: `password123`

3. **Navigate** to a capability (e.g., Product Planning)

4. **Create Test Card**:
   - Activity Name: `TEST - Kanban Data Persistence`
   - Capability: `Product Planning`
   - Owner: `Pelayo`
   - Business Category: `Content`
   - Start Date: Today
   - Target Date: 7 days from now
   - Status: `Green (On Track)`
   - Lane: `In Progress`
   - Comments: `Testing kanban card persistence after fix`

5. **Save** the card

6. **Verify Display**:
   - Check that the card shows:
     - ✅ Owner name (Pelayo)
     - ✅ Business category (Content)
     - ✅ Due date
   - Click on the card
   - Verify all fields are populated in the edit form

7. **Test Persistence**:
   - Close the browser completely
   - Open a new browser window
   - Go back to https://business-tracker-v1.pages.dev/
   - Login again
   - Navigate to Product Planning
   - **Verify**: Your test card is still there with all data intact

8. **Test Edit**:
   - Click on the test card
   - Modify the comments
   - Save
   - Refresh the page
   - Click the card again
   - **Verify**: Your changes persisted

9. **Clean Up**:
   - Delete the test card
   - It's removed permanently from production database

## 🔧 **Staging Testing (Limited Scope)**

If you want to quickly test in staging (understanding its limitations):

1. **Go to**: https://3000-iy0c13hbq65mj1ofyswlo-6532622b.e2b.dev/

2. **Create a test card** (same process as above)

3. **Within the same browser session**:
   - Refresh the page
   - Data should persist
   - Console logs will show what's being saved

4. **Check Console Logs** (F12 → Console):
   ```
   💾 Saving card: id_123... Owner: Pelayo Capability: Product Planning
   ✅ Created kanban card: id_123...
   ```

5. **Verify in Database** (from sandbox terminal):
   ```bash
   cd /home/user/webapp
   npx wrangler d1 execute drumtree-tracker-db --local \
     --command="SELECT card_id, title, owner, capability, start_date, target_date FROM kanban_cards"
   ```

6. **Limitations**:
   - ⚠️ If sandbox restarts, data is gone
   - ⚠️ After 1 hour of inactivity, data may be lost
   - ⚠️ Not suitable for multi-day testing

## 🎓 **Best Practice: Use Both**

### **Use Staging For**:
- Quick functional testing
- Debugging with console logs
- Development iterations
- Testing before deploying to production

### **Use Production For**:
- Verifying actual persistence
- Final acceptance testing
- Real business data
- Multi-day workflows
- Confirming the fix works as expected

## ✅ **Expected Results (Both Environments)**

After creating a kanban card, you should see:

1. **On the Card Display**:
   - Name clearly visible
   - Owner icon with username
   - Business category icon
   - Due date with countdown

2. **When Clicking the Card**:
   - All fields populated:
     - Activity Name ✓
     - Capability ✓
     - Owner ✓
     - Business Category ✓
     - Start Date ✓
     - Target Date ✓
     - Status Indicator ✓
     - Lane ✓
     - Comments ✓

3. **After Refresh** (production only guaranteed):
   - Card still visible
   - All data intact
   - Can edit and changes persist

## 🔒 **Production Safety**

- Production database is separate from staging
- Test data can be easily deleted
- Changes are permanent (by design)
- Recommended: Use test prefix like "TEST -" for easy identification

## 📞 **Support**

If persistence fails in **production** after following this guide:
1. Check browser console for errors (F12)
2. Verify migration was applied: `npx wrangler d1 migrations list drumtree-tracker-db --remote`
3. Check database directly: `npx wrangler d1 execute drumtree-tracker-db --remote --command="SELECT * FROM kanban_cards LIMIT 5"`

---
**Created**: January 24, 2026
**Environment**: Staging & Production
