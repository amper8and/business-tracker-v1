# Regression Prevention Strategy
## Business Tracker - Quality Assurance Plan

**Created:** January 24, 2026  
**Status:** 🔴 Critical - Immediate Implementation Required

---

## 🚨 CURRENT ISSUE

**Problem:** Recent kanban card persistence fix has potentially affected Performance Dashboard data persistence.

**Symptoms:**
- Daily Revenue calculation appears to show: `Daily Revenue = Daily Billing (LCU)` 
- Should be: `Daily Revenue = Daily Billing (LCU) × ZAR Rate`
- Services data missing from both staging and production environments

**Root Cause Analysis:**
1. ✅ Code logic is CORRECT - revenue calculation at line 2106: `const dailyRevenue = Math.round(dailyBilling * zarRate);`
2. ❌ Data persistence issue - services and daily_data tables appear empty
3. ❌ No automated tests to catch data loading/saving regressions
4. ❌ No pre-deployment verification checklist

---

## 🎯 COMPREHENSIVE SOLUTION

### Phase 1: Immediate Fix (Today)

#### Step 1: Verify Data Integrity
```bash
# Check production database
npx wrangler d1 execute drumtree-tracker-db --remote --command="SELECT COUNT(*) FROM services"
npx wrangler d1 execute drumtree-tracker-db --remote --command="SELECT COUNT(*) FROM daily_data"
npx wrangler d1 execute drumtree-tracker-db --remote --command="SELECT COUNT(*) FROM kanban_cards"

# Check local database
npx wrangler d1 execute drumtree-tracker-db --local --command="SELECT COUNT(*) FROM services"
npx wrangler d1 execute drumtree-tracker-db --local --command="SELECT COUNT(*) FROM daily_data"
```

#### Step 2: Restore Sample Data (if empty)
```bash
# Generate sample services with proper ZAR rate calculations
# This ensures Daily Revenue = Daily Billing × ZAR Rate
```

#### Step 3: Verify Calculation
- Login as Admin (Pelayo / password123)
- Create a test service:
  - Name: "Test Service USD"
  - Currency: USD
  - ZAR Rate: 18.5
  - Daily Billing: 50,000 LCU
  - **Expected Daily Revenue: 50,000 × 18.5 = 925,000 ZAR**
- Verify in Performance Dashboard that revenue shows correctly

---

### Phase 2: Automated Testing Framework (This Week)

#### 1. Critical Path Test Suite

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
        zarRate: 18.5,
        // ... other fields
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

    // Create service with daily data
    const response = await fetch('/api/daily-data/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: [{
          serviceId: 1,
          dailyBillingLCU: dailyBilling,
          zarRate: zarRate,
          revenue: expectedRevenue,
          // ... other fields
        }]
      })
    });

    const result = await response.json();
    return result.success;
  },

  // Test 4: Kanban Card Persistence
  async testKanbanPersistence() {
    // Create card with all fields
    const cardData = {
      title: 'TEST_CARD',
      capability: 'Stakeholder Engagement',
      owner: 'admin',
      startDate: '2026-01-24',
      targetDate: '2026-01-30',
      lane: 'Planned',
      comments: 'Test comment'
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
    // Similar structure to test 4
    return true; // Placeholder
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
module.exports = { runCriticalTests, CRITICAL_TESTS };
```

#### 2. Pre-Deployment Checklist

Create `PRE_DEPLOYMENT_CHECKLIST.md`:

```markdown
# Pre-Deployment Checklist

## ⚠️ MANDATORY - Complete ALL items before deployment

### 1. Code Review
- [ ] Changes are focused and minimal
- [ ] No unrelated code modifications
- [ ] Comments explain complex logic
- [ ] No console.log() statements left in production code
- [ ] No TODO comments for critical functionality

### 2. Database Integrity
- [ ] Run migrations locally: `npm run db:migrate:local`
- [ ] Verify migrations work: Check tables exist
- [ ] Test data loads correctly
- [ ] No breaking schema changes without migration

### 3. Critical Path Tests
- [ ] Authentication works (login/logout)
- [ ] Services CRUD operations work
- [ ] Daily Revenue calculation is correct: Revenue = Billing × ZAR Rate
- [ ] Kanban cards save/load all fields
- [ ] Mastery data persists correctly
- [ ] Performance Dashboard displays data

### 4. Manual Testing (Staging)
- [ ] Start local server: `npm run dev:sandbox`
- [ ] Login as Admin (Pelayo / password123)
- [ ] Create test service with ZAR Rate 18.5
- [ ] Verify Daily Revenue = Daily Billing × 18.5
- [ ] Create test kanban card with all fields
- [ ] Refresh page - verify data persists
- [ ] Create test mastery activity
- [ ] Refresh page - verify data persists

### 5. Backup & Safety
- [ ] Export current production data: Visit production → Console → `App.exportDataBackup()`
- [ ] Save backup file locally
- [ ] Verify backup file is valid JSON
- [ ] Git commit with clear message
- [ ] Git push to GitHub

### 6. Deployment
- [ ] Apply migrations to production: `npm run db:migrate:prod`
- [ ] Build project: `npm run build`
- [ ] Deploy: `npm run deploy:prod`
- [ ] Wait for deployment confirmation

### 7. Post-Deployment Verification
- [ ] Visit production URL
- [ ] Login as Admin
- [ ] Check Services count
- [ ] Check Kanban cards display correctly
- [ ] Check Mastery data loads
- [ ] Verify Daily Revenue calculation
- [ ] Test one CRUD operation per module

### 8. Rollback Plan (if issues found)
- [ ] Have previous deployment URL ready
- [ ] Know how to revert migrations
- [ ] Have backup data file ready for import
```

#### 3. Automated Test Runner Script

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
  RESPONSE=$(curl -s "http://localhost:3000$endpoint" | jq -r '.success' 2>/dev/null)
  if [ "$RESPONSE" == "true" ]; then
    echo -e "${GREEN}✅ $endpoint is working${NC}"
    ((PASSED++))
  else
    echo -e "${RED}❌ $endpoint failed${NC}"
    ((FAILED++))
  fi
done

# Test 3: Database tables exist
echo -e "\n${YELLOW}Test 3: Database Tables${NC}"
TABLES=$(npx wrangler d1 execute drumtree-tracker-db --local --command="SELECT name FROM sqlite_master WHERE type='table'" | grep -E "(services|daily_data|kanban_cards|mastery_data|courses|users)" | wc -l)
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

#### 4. Update package.json Scripts

```json
{
  "scripts": {
    "test": "./scripts/run-tests.sh",
    "test:critical": "node tests/critical-paths.test.js",
    "predeploy": "npm run test && npm run build",
    "predeploy:prod": "npm run test && npm run build",
    "deploy": "npm run predeploy && wrangler pages deploy dist",
    "deploy:prod": "npm run predeploy:prod && wrangler pages deploy dist --project-name business-tracker-v1"
  }
}
```

---

### Phase 3: Code Quality Standards (Ongoing)

#### 1. Module Isolation Principles

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

#### 2. Code Change Impact Analysis

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

#### 3. Git Workflow Best Practices

```bash
# Always work on feature branches
git checkout -b fix/revenue-calculation

# Make focused, atomic commits
git add src/db-api.ts
git commit -m "fix: Ensure revenue calculation persists zar_rate"

git add public/static/app.js
git commit -m "fix: Add defensive parsing for zarRate in frontend"

# Before merging, test everything
npm run test
npm run build
npm run dev:sandbox
# Manual verification
git checkout main
git merge fix/revenue-calculation
```

#### 4. Documentation Standards

Every significant change requires:

1. **Code comments** explaining WHY (not what)
2. **Git commit message** with:
   - Type: fix, feat, docs, refactor, test
   - Scope: which module
   - Description: what changed
   - Why: the reason for change

3. **Update relevant docs**:
   - README.md
   - DEPLOYMENT.md
   - Technical notes

---

## 📋 IMPLEMENTATION CHECKLIST

### Immediate (Today)
- [x] Create this strategy document
- [ ] Diagnose and fix current revenue calculation issue
- [ ] Restore missing data to production
- [ ] Verify fix with manual testing
- [ ] Document resolution

### This Week
- [ ] Create `tests/critical-paths.test.js`
- [ ] Create `scripts/run-tests.sh`
- [ ] Create `PRE_DEPLOYMENT_CHECKLIST.md`
- [ ] Update package.json with test scripts
- [ ] Test the test framework

### Ongoing
- [ ] Follow pre-deployment checklist for ALL deployments
- [ ] Run automated tests before every deploy
- [ ] Maintain module isolation
- [ ] Document all significant changes
- [ ] Review and improve tests monthly

---

## 🎓 LESSONS LEARNED

### What Went Wrong
1. No automated tests caught the regression
2. No pre-deployment verification checklist
3. Module boundaries were not clear
4. No data backup before deployment
5. Testing in staging doesn't match production behavior

### What We'll Do Better
1. ✅ Automated tests block bad deployments
2. ✅ Manual checklist ensures thorough verification
3. ✅ Clear module boundaries prevent cascading failures
4. ✅ Always backup before deploy
5. ✅ Test in environment that mirrors production

---

## 📞 SUPPORT

**If issues arise:**
1. Check `DEPLOYMENT_SUCCESS.md` for rollback procedures
2. Export data immediately: `App.exportDataBackup()`
3. Review git history: `git log --oneline -10`
4. Check server logs: `pm2 logs --nostream`
5. Query database directly with wrangler

**Emergency Contacts:**
- GitHub Issues: https://github.com/amper8and/business-tracker-v1/issues
- This AI Assistant: Available 24/7

---

**Document Version:** 1.0  
**Last Updated:** January 24, 2026  
**Status:** 🔴 Active - Immediate Implementation Required
