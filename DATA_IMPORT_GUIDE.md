# 📊 DATA IMPORT GUIDE - Quick Upload Solution

## 🚀 Access the Import Tool

**URL:** https://c216d597.business-tracker-v1.pages.dev/static/import.html

---

## ✅ THREE WAYS TO IMPORT YOUR DATA

### **Option 1: Use CSV Template (Recommended)**

1. **Download the template**:
   - Go to import tool: https://c216d597.business-tracker-v1.pages.dev/static/import.html
   - Click "📥 Download CSV Template"
   - Opens in Excel or Google Sheets

2. **Fill in your data**:
   - Each row = one day of data for one service
   - Required columns:
     - `service_name` - e.g., "YoGamezPro"
     - `category` - e.g., "Content Business"
     - `account` - e.g., "Vodacom"
     - `country` - e.g., "ZIMBABWE"
     - `currency` - e.g., "USD"
     - `zar_rate` - e.g., 18.5
     - `required_run_rate` - e.g., 50000
     - `subscriber_base` - e.g., 85000
     - `day` - 1, 2, 3... (day of month)
     - `date` - e.g., "2026-01-01"
     - `daily_billing_lcu` - e.g., 50000
     - `target` - e.g., 46000
     - `churned_subs` - e.g., 1700
     - `daily_acquisitions` - e.g., 1750
     - `net_additions` - e.g., 50
     - `subscriber_base_daily` - e.g., 85050

3. **Save as CSV** and upload

---

### **Option 2: Excel File (Direct Upload)**

1. Create Excel file with same columns as template
2. Multiple services on same sheet (group by service_name)
3. Save as `.xlsx` or `.xls`
4. Drag & drop into import tool

**Example Excel structure:**
```
| service_name | category | account | country | day | date | daily_billing_lcu | ... |
|--------------|----------|---------|---------|-----|------|-------------------|-----|
| YoGamezPro   | Content  | Vodacom | ZW      | 1   | 2026-01-01 | 50000       | ... |
| YoGamezPro   | Content  | Vodacom | ZW      | 2   | 2026-01-02 | 51000       | ... |
| MobiStream   | Content  | MTN     | ZA      | 1   | 2026-01-01 | 48000       | ... |
```

---

### **Option 3: Copy from Existing Spreadsheet**

If you already have data in a spreadsheet:

1. **Add header row** to match template format
2. **Map your columns** to the required names
3. **Export as CSV**
4. **Upload to import tool**

---

## 🔍 IMPORT PROCESS

### **Step 1: Upload File**
- Click upload area or drag & drop
- Supports: `.csv`, `.xlsx`, `.xls`
- Instant parsing and validation

### **Step 2: Preview Data**
- See parsed data in table
- Check row count and services
- Verify values are correct

### **Step 3: Import to Database**
- Click "✅ Import to Database"
- Data saves to Cloudflare D1
- Confirmation message on success

### **Step 4: Verify**
- Refresh main app
- Check Performance Dashboard
- Data should appear immediately

---

## 📋 CSV FORMAT EXAMPLE

```csv
service_name,category,account,country,currency,zar_rate,required_run_rate,subscriber_base,day,date,daily_billing_lcu,target,churned_subs,daily_acquisitions,net_additions,subscriber_base_daily
YoGamezPro,Content Business,Vodacom,ZIMBABWE,USD,18.5,50000,85000,1,2026-01-01,50000,46000,1700,1750,50,85050
YoGamezPro,Content Business,Vodacom,ZIMBABWE,USD,18.5,50000,85000,2,2026-01-02,51000,47000,1690,1740,50,85100
YoGamezPro,Content Business,Vodacom,ZIMBABWE,USD,18.5,50000,85000,3,2026-01-03,49000,45000,1710,1760,50,85150
MobiStream,Content Business,MTN,SOUTH AFRICA,ZAR,1.0,48000,69000,1,2026-01-01,48000,45000,1380,1400,20,69020
MobiStream,Content Business,MTN,SOUTH AFRICA,ZAR,1.0,48000,69000,2,2026-01-02,47000,44000,1385,1410,25,69045
```

---

## ⚠️ IMPORTANT NOTES

### **Data Grouping:**
- Tool automatically groups rows by `service_name`
- All rows with same service_name = one service
- Daily data attached to that service

### **Required Fields:**
- **Must have values**: service_name, category, account, country, currency, zar_rate, required_run_rate, day, date
- **Can be 0**: daily_billing_lcu, target, churned_subs, daily_acquisitions, net_additions, subscriber_base

### **Date Format:**
- Use: `YYYY-MM-DD` (e.g., 2026-01-01)
- Or Excel date format (will auto-convert)

### **Numbers:**
- No commas or currency symbols
- Decimals allowed (e.g., 18.5 for ZAR rate)
- Whole numbers for subscribers

### **Country Names:**
- Use: ZIMBABWE, SOUTH AFRICA, KENYA, TANZANIA, etc.
- System converts to codes automatically

---

## 🎯 QUICK START (5 Minutes)

1. Go to: https://c216d597.business-tracker-v1.pages.dev/static/import.html
2. Click "📥 Download CSV Template"
3. Fill in 2-3 services with 5-10 days each
4. Save and upload
5. Click "Import to Database"
6. Go to main app - data is live!

---

## ✅ VERIFICATION

After import, verify in main app:

```javascript
// Open browser console (F12) on main app
fetch('/api/services').then(r => r.json()).then(console.log)
```

You should see all imported services with daily data.

---

## 🚨 TROUBLESHOOTING

### **"Import failed" error:**
- Check all required columns are present
- Verify data types (numbers vs text)
- Ensure dates are valid format
- Check for duplicate service_name + date combinations

### **Data not showing in app:**
- Refresh the main app page
- Clear browser cache if needed
- Check import tool showed success message

### **Wrong values imported:**
- Download template again
- Double-check column names match exactly
- Re-upload with correct mapping

---

## 💾 BACKUP RECOMMENDATION

Before importing:
1. Download template
2. Fill with your data
3. **Save a copy** of the filled CSV (backup)
4. Upload to import tool

This way you have a backup of your data in CSV format.

---

## 📊 NEXT STEPS AFTER IMPORT

1. ✅ Verify data in Performance Dashboard
2. ✅ Check Service Breakdown table
3. ✅ Review Daily Data Breakdown
4. ✅ Test Edit functions
5. ✅ Add more data as needed

---

**Your data is now permanently stored in Cloudflare D1 database!** 🎉
