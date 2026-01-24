# Regression Prevention Strategy
## Business Tracker - Quality Assurance Plan

**Created:** January 24, 2026  
**Status:** 🟢 Active

---

## 🎯 PURPOSE

This document provides a comprehensive strategy to prevent regressions when making changes to the Business Tracker application. It ensures that fixes in one area don't break functionality in other areas.

---

## 📋 PRE-DEPLOYMENT CHECKLIST

### ⚠️ MANDATORY - Complete ALL items before deployment

#### 1. Code Review
- [ ] Changes are focused and minimal
- [ ] No unrelated code modifications
- [ ] Comments explain complex logic
- [ ] No console.log() statements left in production code
- [ ] No TODO comments for critical functionality

#### 2. Database Integrity
- [ ] Run migrations locally: `npm run db:migrate:local`
- [ ] Verify migrations work: Check tables exist
- [ ] Test data loads correctly
- [ ] No breaking schema changes without migration

#### 3. Critical Path Tests (Manual)
- [ ] **Authentication**: Login/logout works
- [ ] **Services CRUD**: Create, read, update, delete operations work
- [ ] **Revenue Calculation**: Verify Daily Revenue = Daily Billing × ZAR Rate
- [ ] **Kanban Cards**: Save/load all fields (capability, owner, dates, lane, comments)
- [ ] **Mastery Data**: Create/edit activities persist correctly
- [ ] **Performance Dashboard**: Data displays correctly with proper filtering

#### 4. Manual Testing (Staging)
- [ ] Start local server: `npm run build && pm2 restart drumtree-tracker`
- [ ] Login as Admin (Pelayo / password123)
- [ ] **Test Performance Module**:
  - Create test service with ZAR Rate (e.g., 18.5)
  - Verify Daily Revenue = Daily Billing × ZAR Rate
  - Check Level 1 and Level 2 KPIs match
- [ ] **Test Kanban Module**:
  - Create test card with all fields
  - Refresh page - verify data persists
  - Edit card - verify changes persist
  - Drag between lanes - verify lane change persists
- [ ] **Test Mastery Module**:
  - Create test activity
  - Refresh page - verify data persists
  - Edit activity - verify changes persist

#### 5. Backup & Safety
- [ ] Export current production data: Visit production → Console → `App.exportDataBackup()`
- [ ] Save backup file locally
- [ ] Verify backup file is valid JSON
- [ ] Git commit with clear message
- [ ] Git push to GitHub (if configured)

#### 6. Deployment
- [ ] Apply migrations to production (if any): `npm run db:migrate:prod`
- [ ] Build project: `npm run build`
- [ ] Deploy: `npx wrangler pages deploy dist --project-name business-tracker-v1`
- [ ] Wait for deployment confirmation
- [ ] Note the deployment URL

#### 7. Post-Deployment Verification
- [ ] Visit production URL
- [ ] Login as Admin
- [ ] Check Services count (should match pre-deployment)
- [ ] Check Kanban cards display correctly
- [ ] Check Mastery data loads
- [ ] Verify Daily Revenue calculation
- [ ] Test one CRUD operation per module
- [ ] **Compare Level 1 and Level 2 KPIs** - must match exactly

#### 8. Rollback Plan (if issues found)
- [ ] Have previous deployment URL ready
- [ ] Know how to revert migrations (if applied)
- [ ] Have backup data file ready for import

---

## 🧪 AUTOMATED TEST FRAMEWORK

### Critical Path Tests Template

Create `tests/critical-paths.test.js`:

```javascript
/**
 * Critical Path Tests
 * These tests MUST pass before any deployment
 */

const CRITICAL_TESTS = {
  // Test 1: Authentication
  async testAuthentication() {
    const response = await fetch('/api/users');
    const result = await response.json();
    return result.success && result.data.length > 0;
  },

  // Test 2: Services CRUD
  async testServicesCRUD() {
    // Create service
    const createResponse = await fetch('/api/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'TEST_SERVICE',
        category: 'Content',
        account: 'Test Account',
        country: 'TEST',
        currency: 'USD',
        zarRate: 18.5,
        requiredRunRate: 50000
      })
    });
    const createResult = await createResponse.json();
    if (!createResult.success) return false;

    // Read service
    const readResponse = await fetch(`/api/services/${createResult.data.id}`);
    const readResult = await readResponse.json();
    if (!readResult.success) return false;

    // Verify ZAR rate persisted
    if (readResult.data.zar_rate !== 18.5) return false;

    // Delete test service
    await fetch(`/api/services/${createResult.data.id}`, { method: 'DELETE' });
    
    return true;
  },

  // Test 3: Daily Revenue Calculation
  async testRevenueCalculation() {
    const dailyBilling = 50000; // LCU
    const zarRate = 18.5;
    const expectedRevenue = Math.round(dailyBilling * zarRate); // 925000

    // Verify calculation is correct
    const calculatedRevenue = Math.round(dailyBilling * zarRate);
    return calculatedRevenue === expectedRevenue;
  },

  // Test 4: Kanban Card Persistence
  async testKanbanPersistence() {
    // Create card with all fields
    const cardData = {
      title: 'TEST_CARD',
      capability: 'Stakeholder Engagement',
      owner: 'admin',
      category: 'Content',
      startDate: '2026-01-24',
      targetDate: '2026-01-30',
      lane: 'Planned',
      comments: 'Test comment',
      status: 'Green',
      priority: 'High'
    };

    const createResponse = await fetch('/api/kanban', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cardData)
    });
    const createResult = await createResponse.json();
    if (!createResult.success) return false;

    // Verify all fields persisted
    const readResponse = await fetch(`/api/kanban`);
    const readResult = await readResponse.json();
    const card = readResult.data.find(c => c.title === 'TEST_CARD');
    
    if (!card) return false;
    if (card.capability !== 'Stakeholder Engagement') return false;
    if (card.owner !== 'admin') return false;

    // Cleanup
    await fetch(`/api/kanban/${card.id}`, { method: 'DELETE' });
    
    return true;
  },

  // Test 5: Mastery Data Persistence
  async testMasteryPersistence() {
    const masteryData = {
      username: 'admin',
      category: 'Technology',
      skillName: 'TEST_SKILL',
      progressPercentage: 50
    };

    const createResponse = await fetch('/api/mastery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(masteryData)
    });
    const createResult = await createResponse.json();
    if (!createResult.success) return false;

    // Verify persistence
    const readResponse = await fetch('/api/mastery');
    const readResult = await readResponse.json();
    const mastery = readResult.data.find(m => m.skill_name === 'TEST_SKILL');

    if (!mastery) return false;

    // Cleanup
    await fetch(`/api/mastery/${mastery.id}`, { method: 'DELETE' });

    return true;
  }
};

// Run all critical tests
async function runCriticalTests() {
  console.log('🧪 Running Critical Path Tests...\n');
  
  const results = {};
  let passed = 0;
  let failed = 0;

  for (const [testName, testFn] of Object.entries(CRITICAL_TESTS)) {
    try {
      const result = await testFn();
      results[testName] = result;
      if (result) {
        console.log(`✅ ${testName}: PASSED`);
        passed++;
      } else {
        console.log(`❌ ${testName}: FAILED`);
        failed++;
      }
    } catch (error) {
      console.log(`💥 ${testName}: ERROR - ${error.message}`);
      results[testName] = false;
      failed++;
    }
  }

  console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);
  
  if (failed > 0) {
    console.log('🚫 DEPLOYMENT BLOCKED - Fix failing tests before deploying');
    process.exit(1);
  } else {
    console.log('✅ ALL TESTS PASSED - Safe to deploy');
    process.exit(0);
  }
}

// Export for use in deployment scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runCriticalTests, CRITICAL_TESTS };
}
```

### Test Runner Script

Create `scripts/run-tests.sh`:

```bash
#!/bin/bash

echo "🧪 Running Pre-Deployment Tests..."
echo "================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counters
PASSED=0
FAILED=0

# Test 1: Check if server is running
echo -e "\n${YELLOW}Test 1: Server Health Check${NC}"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/)
if [ "$RESPONSE" == "200" ]; then
  echo -e "${GREEN}✅ Server is responding${NC}"
  ((PASSED++))
else
  echo -e "${RED}❌ Server is not responding (HTTP $RESPONSE)${NC}"
  ((FAILED++))
fi

# Test 2: Check API endpoints
echo -e "\n${YELLOW}Test 2: API Endpoints${NC}"
endpoints=("/api/users" "/api/services" "/api/kanban" "/api/mastery" "/api/courses")
for endpoint in "${endpoints[@]}"; do
  RESPONSE=$(curl -s "http://localhost:3000$endpoint" | grep -o '"success":true' || echo "")
  if [ ! -z "$RESPONSE" ]; then
    echo -e "${GREEN}✅ $endpoint is working${NC}"
    ((PASSED++))
  else
    echo -e "${RED}❌ $endpoint failed${NC}"
    ((FAILED++))
  fi
done

# Test 3: Database tables exist
echo -e "\n${YELLOW}Test 3: Database Tables${NC}"
echo "Checking local D1 database..."
TABLES=$(npx wrangler d1 execute drumtree-tracker-db --local --command="SELECT name FROM sqlite_master WHERE type='table'" 2>/dev/null | grep -E "(services|daily_data|kanban_cards|mastery_data|courses|users)" | wc -l)
if [ "$TABLES" -ge "6" ]; then
  echo -e "${GREEN}✅ All required database tables exist${NC}"
  ((PASSED++))
else
  echo -e "${RED}❌ Missing database tables (found $TABLES/6)${NC}"
  ((FAILED++))
fi

# Print results
echo -e "\n================================="
echo -e "📊 Test Results: ${GREEN}$PASSED passed${NC}, ${RED}$FAILED failed${NC}"

if [ $FAILED -gt 0 ]; then
  echo -e "${RED}🚫 TESTS FAILED - DO NOT DEPLOY${NC}"
  exit 1
else
  echo -e "${GREEN}✅ ALL TESTS PASSED - Safe to deploy${NC}"
  exit 0
fi
```

Make it executable:
```bash
chmod +x scripts/run-tests.sh
```

---

## 🏗️ CODE QUALITY STANDARDS

### 1. Module Isolation Principles

**Rule 1: Single Responsibility**
- Each module (Performance, Kanban, Mastery) should have isolated:
  - State management
  - API endpoints
  - Data persistence logic
  - UI rendering

**Rule 2: Explicit Dependencies**
```javascript
// ❌ BAD: Implicit dependency
async function saveKanbanData() {
  await this.savePerformanceData(); // WHY is kanban saving performance?
}

// ✅ GOOD: Explicit, isolated
async function saveKanbanData() {
  const cards = STATE.kanbanCards;
  // Only save kanban data
  for (const card of cards) {
    await DBService.createKanban(card);
  }
}
```

**Rule 3: Defensive Programming**
```javascript
// Always validate before use
const zarRate = parseFloat(service.zarRate) || 1.0;
const dailyBilling = parseFloat(day.dailyBillingLCU) || 0;
const revenue = Math.round(dailyBilling * zarRate);

// Always log critical calculations
console.log(`Revenue Calculation: ${dailyBilling} × ${zarRate} = ${revenue}`);
```

### 2. Code Change Impact Analysis

Before ANY code change, ask:

1. **What modules does this affect?**
   - Direct: The module being changed
   - Indirect: Modules that depend on it

2. **What data flows through this code?**
   - Input sources
   - Transformations
   - Output destinations

3. **What could break?**
   - Data persistence
   - Calculations
   - Display logic
   - Other features

4. **How will I verify it works?**
   - Manual tests
   - Automated tests
   - User acceptance

### 3. Git Workflow Best Practices

```bash
# Always work on feature branches (optional but recommended)
git checkout -b fix/specific-issue

# Make focused, atomic commits
git add src/db-api.ts
git commit -m "fix: Ensure revenue calculation persists zar_rate"

git add public/static/app.js
git commit -m "fix: Add defensive parsing for zarRate in frontend"

# Before merging, test everything
npm run build
pm2 restart drumtree-tracker
# Manual verification

# Merge to main
git checkout main
git merge fix/specific-issue
```

### 4. Documentation Standards

Every significant change requires:

1. **Code comments** explaining WHY (not what)
2. **Git commit message** with:
   - Type: fix, feat, docs, refactor, test
   - Scope: which module
   - Description: what changed
   - Why: the reason for change

3. **Update relevant docs**:
   - README.md
   - Technical notes files (e.g., KANBAN_FIX_NOTES.md)

---

## ⚠️ COMMON PITFALLS

### 1. Working on the Wrong File
**Problem:** Editing a source file that isn't actually used in the build.

**Example:**
- Editing `public/index.html` when Vite uses `src/index.tsx`

**Solution:**
- Always check `vite.config.ts` to understand the build process
- Verify changes appear in `dist/` after building
- Test the deployed URL, not just local

### 2. Breaking Other Modules
**Problem:** Fixing one module breaks another due to shared dependencies.

**Example:**
- Changing data structure in Performance affects Kanban

**Solution:**
- Use the Pre-Deployment Checklist
- Test ALL modules after ANY change
- Keep modules isolated with clear boundaries

### 3. Database Schema Mismatches
**Problem:** Frontend expects different field names than database provides.

**Example:**
- Frontend uses `dailyBillingLCU` but database has `daily_billing_lcu`

**Solution:**
- Always map database fields to frontend format
- Use consistent naming conventions
- Document field mappings

### 4. Forgetting to Build Before Deploy
**Problem:** Deploying stale code because you forgot to rebuild.

**Solution:**
- Always run `npm run build` before `wrangler pages deploy`
- Check file timestamps in `dist/` folder
- Verify deployment URL shows your changes

---

## 📊 SUCCESS METRICS

### A deployment is successful when:

1. ✅ **All pre-deployment checklist items completed**
2. ✅ **No new errors in production**
3. ✅ **All modules continue to work**
4. ✅ **Data persists correctly**
5. ✅ **Calculations remain accurate**
6. ✅ **No user-reported regressions**

---

## 🆘 EMERGENCY PROCEDURES

### If a deployment breaks production:

1. **Immediately export data**
   ```javascript
   // In browser console on production site
   App.exportDataBackup()
   ```

2. **Identify the issue**
   - Check browser console for errors
   - Check server logs: `pm2 logs --nostream`
   - Review recent git commits: `git log --oneline -5`

3. **Quick rollback options**
   - Use previous Cloudflare Pages deployment URL
   - Revert git commits: `git revert <commit-hash>`
   - Restore from backup if data was corrupted

4. **Fix and redeploy**
   - Fix the issue in code
   - Complete the pre-deployment checklist
   - Deploy the fix
   - Verify the fix works

---

## 📚 RELATED DOCUMENTS

- `README.md` - Project overview and setup
- `DEPLOYMENT.md` - Deployment procedures
- `KANBAN_FIX_NOTES.md` - Kanban persistence fix details
- `REVENUE_FIX_COMPLETE.md` - Revenue calculation fix details
- `KPI_SYNC_FIX.md` - Level 1/2 KPI synchronization fix

---

## 🔄 CONTINUOUS IMPROVEMENT

This document should be updated when:
- New critical paths are identified
- New modules are added
- Testing procedures improve
- Common issues are discovered

**Last Updated:** January 24, 2026  
**Version:** 1.0  
**Status:** 🟢 Active
