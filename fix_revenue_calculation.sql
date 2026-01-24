-- Fix Revenue Calculation in Production Database
-- This updates ALL daily_data records to correctly calculate:
-- revenue = daily_billing_lcu × zar_rate

UPDATE daily_data 
SET 
  revenue = ROUND(daily_billing_lcu * zar_rate, 2),
  updated_at = CURRENT_TIMESTAMP
WHERE 
  ABS(revenue - (daily_billing_lcu * zar_rate)) > 1;

-- Verify the fix
SELECT 
  'Fixed records:' as message,
  COUNT(*) as count,
  'Sample verification:' as note
FROM daily_data
WHERE ABS(revenue - (daily_billing_lcu * zar_rate)) < 1;

-- Show first 5 records after fix
SELECT 
  date,
  daily_billing_lcu,
  zar_rate,
  revenue,
  ROUND(daily_billing_lcu * zar_rate, 2) as expected_revenue,
  CASE 
    WHEN ABS(revenue - (daily_billing_lcu * zar_rate)) < 1 THEN '✅ CORRECT'
    ELSE '❌ WRONG'
  END as status
FROM daily_data 
ORDER BY date
LIMIT 5;
