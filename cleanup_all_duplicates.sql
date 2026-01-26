-- Comprehensive cleanup of ALL duplicate services
-- Strategy: Keep the lowest ID (oldest), merge daily_data, delete duplicates

-- 1. MyKidzHub EcZW (USD): Keep 15, delete 27
UPDATE daily_data SET service_id = 15 WHERE service_id = 27;
DELETE FROM services WHERE id = 27;

-- 2. MyKidzHub EcZW (ZWG): Keep 16, delete 26
UPDATE daily_data SET service_id = 16 WHERE service_id = 26;
DELETE FROM services WHERE id = 26;

-- 3. YoGamezPro EcZW (USD): Keep 12, delete 25
UPDATE daily_data SET service_id = 12 WHERE service_id = 25;
DELETE FROM services WHERE id = 25;

-- 4. YoGamezPro EcZW (ZWG): Keep 11, delete 24
UPDATE daily_data SET service_id = 11 WHERE service_id = 24;
DELETE FROM services WHERE id = 24;

-- 5. YoNumbers EcZW (USD): Keep 13, delete 23
UPDATE daily_data SET service_id = 13 WHERE service_id = 23;
DELETE FROM services WHERE id = 23;

-- Verification: Check for any remaining duplicates
SELECT name, service_version, service_sku, currency, COUNT(*) as count 
FROM services 
GROUP BY name, service_version, service_sku, currency 
HAVING count > 1;

-- Verification: Count total services
SELECT COUNT(*) as total_services FROM services;
