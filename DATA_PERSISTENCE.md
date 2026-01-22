# DrumTree Business Tracker - Data Persistence Documentation

## ✅ Data Persistence Guarantee

**Your data is fully persistent and will NOT be regenerated or changed by system updates.**

## How Data Persistence Works

### 1. Storage Mechanism
- **Location**: Browser localStorage (client-side)
- **Key**: `performanceData`
- **Version Flag**: `drumtree_data_version` (prevents regeneration)

### 2. Data Initialization Logic

```javascript
// First time initialization ONLY
if (no data exists && no version flag) {
    // Generate sample data (YoGamezPro, MobiStream)
    // Set version flag to '1.0'
    // Save to localStorage
}

// All subsequent loads
if (data exists OR version flag exists) {
    // Load existing data from localStorage
    // NEVER regenerate
}
```

### 3. Automatic Save Points

Data is automatically saved to localStorage after every modification:

#### Service Management
- ✅ Add new service
- ✅ Edit existing service
- ✅ Delete service
- ✅ Add SKU variant
- ✅ Delete SKU variant

#### Bulk Data Editing
- ✅ Edit multiple entries in Bulk Edit Modal
- ✅ Save bulk changes
- ✅ Add new month data (e.g., December 2025)

#### Daily Data Editing
- ✅ Edit individual daily data entries
- ✅ Save daily data changes

### 4. Data Structure

```json
{
  "services": [
    {
      "name": "YoGamezPro",
      "category": "Content Business",
      "account": "Vodacom",
      "country": "ZIMBABWE",
      "currency": "USD",
      "zarRate": 18.5,
      "serviceVersion": "YoGamezPro VoZW",
      "serviceSKU": "YoGamezPro VoZW (USD)",
      "mtdRevenue": 1250000,
      "mtdTarget": 1200000,
      "actualRunRate": 48076,
      "requiredRunRate": 50000,
      "subscriberBase": 85000,
      "mtdNetAdditions": 1500,
      "dailyData": [
        {
          "day": 1,
          "date": "2026-01-01",
          "businessCategory": "Content Business",
          "account": "Vodacom",
          "country": "ZIMBABWE",
          "currency": "USD",
          "zarRate": 18.5,
          "dailyBillingLCU": 50873,
          "revenue": 941151,
          "target": 869450,
          "churnedSubs": 1700,
          "dailyAcquisitions": 1785,
          "netAdditions": 85,
          "subscriberBase": 85085
        }
        // ... more daily data
      ]
    }
  ],
  "filters": {
    "category": "All",
    "account": "All",
    "country": "All",
    "service": "All",
    "month": "2026-01"
  }
}
```

## Admin Utilities (Browser Console)

### Export Data Backup
```javascript
App.exportDataBackup()
```
- Downloads a JSON file: `drumtree-backup-YYYY-MM-DD.json`
- Contains all performance data + version info
- Use for backups before major changes

### Import Data Backup
```javascript
// First, read your backup file
const backupData = { /* your backup JSON */ };
App.importDataBackup(backupData);
```
- Restores data from a previous backup
- Automatically reloads the page
- Admin only

### View Current Data (Read-Only)
```javascript
console.log(STATE.performanceData)
```
- View all current data in console
- Does not modify anything

### Clear All Data (⚠️ DANGER)
```javascript
App.clearAllData()
```
- Permanently deletes ALL performance data
- Requires confirmation
- Cannot be undone without a backup
- Admin only
- **USE WITH EXTREME CAUTION**

### Reset Data Version (Advanced)
```javascript
App.resetDataVersion()
```
- Removes version flag
- System will regenerate sample data ONLY if no data exists
- Admin only
- Rarely needed

## Data Migration Between Environments

### Production → Development
1. Open production site in browser
2. Open browser console (F12)
3. Run: `App.exportDataBackup()`
4. Open development site
5. Login as Admin
6. Open browser console
7. Copy backup JSON content
8. Run: `App.importDataBackup(backupData)`

### Browser → Browser (Same User)
- Data is tied to browser localStorage
- To sync across browsers:
  1. Export from Browser A
  2. Import to Browser B
  3. Or use same browser profile/sync

## Future: Server-Side Persistence

**Current**: Client-side localStorage (per browser)
**Recommended Future Enhancement**: Server-side database

### Migration Path to Server
1. Add Cloudflare D1 database backend
2. Create API endpoints for CRUD operations
3. Sync localStorage data to D1 on save
4. Load from D1 on initialization
5. Keep localStorage as cache layer

### Why Server-Side is Better
- ✅ Data accessible from any device
- ✅ Team collaboration (multiple users)
- ✅ Backup and disaster recovery
- ✅ Data integrity and validation
- ✅ Audit trail (who changed what, when)

## Current Limitations

### LocalStorage Limitations
- **Browser-Specific**: Data only accessible in the same browser
- **Size Limit**: ~5-10MB per domain (sufficient for years of data)
- **No Collaboration**: Each user has their own data
- **Clearing Cache**: If user clears browser data, localStorage is lost
  - **Mitigation**: Regular backups using `App.exportDataBackup()`

### Data Safety Best Practices
1. **Regular Backups**: Export weekly/monthly
2. **Before Major Updates**: Always export before system updates
3. **Multiple Copies**: Keep backups in different locations
4. **Test Imports**: Periodically test backup restoration

## Verification Steps

### Verify Data Persistence
1. Login and add/edit some data
2. Close browser completely
3. Reopen and login
4. ✅ All changes should be present

### Verify Version Flag
Open browser console:
```javascript
localStorage.getItem('drumtree_data_version')
// Should return: "1.0"
```

### Verify Data Exists
Open browser console:
```javascript
localStorage.getItem('performanceData')
// Should return: JSON string with all your data
```

## Troubleshooting

### Data Disappeared
**Cause**: Browser cache cleared or localStorage manually deleted
**Solution**: 
1. Import from latest backup: `App.importDataBackup(backupData)`
2. If no backup, data is unrecoverable from localStorage
3. **Prevention**: Regular exports

### Data Not Saving
**Check**:
```javascript
// Try manual save
App.savePerformanceData()

// Check if data exists
console.log(STATE.performanceData)

// Check localStorage
localStorage.getItem('performanceData')
```

### Sample Data Regenerating
**Cause**: Version flag missing or data corrupted
**Solution**:
```javascript
// Check version
localStorage.getItem('drumtree_data_version')
// If null, set it:
localStorage.setItem('drumtree_data_version', '1.0')
```

## Summary

✅ **Data is Persistent**: All changes are saved to localStorage immediately
✅ **Never Regenerates**: Once initialized, sample data NEVER regenerates
✅ **Safe from Code Updates**: System updates do NOT affect stored data
✅ **Backup Capability**: Export/import functions for data safety
✅ **Admin Controls**: Full data management via console commands

⚠️ **Important**: Keep regular backups since localStorage can be cleared by users

🔮 **Future**: Consider migrating to Cloudflare D1 for server-side persistence and team collaboration
