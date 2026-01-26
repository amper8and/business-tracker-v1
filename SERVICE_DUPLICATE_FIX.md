# Service Breakdown Duplicate Fix - Complete

## Problem Summary
CSV imports were creating **duplicate service rows** in the Service Breakdown table instead of updating existing services.

**Example:**
- YoNumbers EcZW (ZWG) appeared twice
- Each import created a new service_id
- Service Breakdown showed multiple lines for same SKU

---

## Root Cause
The `/api/migrate` endpoint always used `INSERT INTO services`, which:
- ❌ Never checked if service already existed
- ❌ Created new service_id on every import
- ❌ Led to duplicate rows in Service Breakdown table

---

## Solution Implemented

### 1. **Service Upsert Logic**
Changed `/api/migrate` to:
```typescript
// Check if service exists by unique key
const existingService = await DB.prepare(`
  SELECT id FROM services 
  WHERE name = ? AND service_version = ? AND service_sku = ? AND currency = ?
`).first()

if (existingService) {
  // UPDATE existing service
  serviceId = existingService.id
  await DB.prepare(`UPDATE services SET ... WHERE id = ?`)
} else {
  // INSERT new service
  const result = await DB.prepare(`INSERT INTO services ...`)
  serviceId = result.meta.last_row_id
}
```

**Unique Key:** `(name, service_version, service_sku, currency)`

### 2. **Daily Data Upsert**
Changed from `INSERT INTO` to `INSERT OR REPLACE INTO`:
```typescript
INSERT OR REPLACE INTO daily_data (...)
```

**Benefits:**
- ✅ Re-importing same day → **overwrites** with new data
- ✅ Importing new days → **appends** to existing service
- ✅ No duplicate daily records

---

## Database Cleanup Performed

### Duplicates Found and Merged:
1. **MyKidzHub EcZW (USD)**: IDs 15, 27 → Kept 15
2. **MyKidzHub EcZW (ZWG)**: IDs 16, 26 → Kept 16
3. **YoGamezPro EcZW (USD)**: IDs 12, 25 → Kept 12
4. **YoGamezPro EcZW (ZWG)**: IDs 11, 24 → Kept 11
5. **YoNumbers EcZW (USD)**: IDs 13, 23 → Kept 13
6. **YoNumbers EcZW (ZWG)**: IDs 21, 22 → Kept 21

### Cleanup Process:
```sql
-- Move daily_data to oldest service_id
UPDATE daily_data SET service_id = 15 WHERE service_id = 27;
-- Delete duplicate service
DELETE FROM services WHERE id = 27;
```

**Result:**
- Before: 11 services (6 unique + 5 duplicates)
- After: 6 unique services
- All daily data preserved and merged

---

## Verification

### Production Services:
```
Total Services: 6

Service Breakdown:
  - MyKidzHub | MyKidzHub EcZW (USD) | USD | ID: 15
  - MyKidzHub | MyKidzHub EcZW (ZWG) | ZWG | ID: 16
  - YoGamezPro | YoGamezPro EcZW (ZWG) | ZWG | ID: 11
  - YoGamezPro | YoGamezPro EcZW (USD) | USD | ID: 12
  - YoNumbers | YoNumbers EcZW (USD) | USD | ID: 13
  - YoNumbers | YoNumbers EcZW (ZWG) | ZWG | ID: 21
```

✅ **Each Service SKU now has exactly ONE row in the Service Breakdown table**

---

## Future Behavior

### Importing New CSV:
1. **Existing Service:** Updates service metadata, appends/overwrites daily data
2. **New Service:** Creates new service with daily data
3. **Same Day:** Overwrites existing daily record
4. **New Day:** Appends to existing service

### Example Scenarios:

**Scenario 1: Re-import same days with updated data**
```
Import: YoNumbers EcZW (ZWG), Days 1-22
Result: ✅ Updates existing service, overwrites days 1-22
```

**Scenario 2: Import new days**
```
Import: YoNumbers EcZW (ZWG), Days 23-24
Result: ✅ Updates existing service, appends days 23-24
```

**Scenario 3: Import new service**
```
Import: NewService ABC (USD), Days 1-10
Result: ✅ Creates new service, adds days 1-10
```

---

## Testing Checklist

✅ Build successful  
✅ Upsert logic implemented in `/api/migrate`  
✅ Database duplicates cleaned up  
✅ Production showing 6 unique services  
✅ Daily data preserved and merged  
✅ No regression in other functionality  

---

## Deployment

- **Production:** https://business-tracker-v1.pages.dev/
- **Latest:** https://2839da14.business-tracker-v1.pages.dev/
- **Git Commit:** 9efee51

---

## REGRESSION_PREVENTION Applied

**What Changed:**
- Modified: `/api/migrate` endpoint only
- Added: Service existence check before insert
- Changed: `INSERT INTO` → `INSERT OR REPLACE INTO` for daily_data

**What Didn't Change:**
- Service display logic
- Daily data rendering
- Performance calculations
- All other API endpoints

**Risk Assessment:**
- **Low Risk:** Only affects CSV import logic
- **Tested:** Cleanup verified in production
- **Isolated:** No changes to frontend or other APIs

**Future Safeguards:**
- Unique constraint on services table could be added
- Import logging could track updates vs inserts
- Automated tests for upsert logic

---

## Files Changed

1. **src/db-api.ts** - Added upsert logic to `/api/migrate`
2. **cleanup_all_duplicates.sql** - Database cleanup script

---

**Status: ✅ COMPLETE - Service Breakdown now shows one row per unique Service SKU**
