-- Fix date format in daily_data table from M/D/YYYY to YYYY-MM-DD
-- This is needed because frontend filtering expects YYYY-MM-DD format

-- Service ID 21 (YoNumbers EcZW ZWG) - Days 1-22
UPDATE daily_data SET date = '2026-01-01' WHERE service_id = 21 AND day = 1;
UPDATE daily_data SET date = '2026-01-02' WHERE service_id = 21 AND day = 2;
UPDATE daily_data SET date = '2026-01-03' WHERE service_id = 21 AND day = 3;
UPDATE daily_data SET date = '2026-01-04' WHERE service_id = 21 AND day = 4;
UPDATE daily_data SET date = '2026-01-05' WHERE service_id = 21 AND day = 5;
UPDATE daily_data SET date = '2026-01-06' WHERE service_id = 21 AND day = 6;
UPDATE daily_data SET date = '2026-01-07' WHERE service_id = 21 AND day = 7;
UPDATE daily_data SET date = '2026-01-08' WHERE service_id = 21 AND day = 8;
UPDATE daily_data SET date = '2026-01-09' WHERE service_id = 21 AND day = 9;
UPDATE daily_data SET date = '2026-01-10' WHERE service_id = 21 AND day = 10;
UPDATE daily_data SET date = '2026-01-11' WHERE service_id = 21 AND day = 11;
UPDATE daily_data SET date = '2026-01-12' WHERE service_id = 21 AND day = 12;
UPDATE daily_data SET date = '2026-01-13' WHERE service_id = 21 AND day = 13;
UPDATE daily_data SET date = '2026-01-14' WHERE service_id = 21 AND day = 14;
UPDATE daily_data SET date = '2026-01-15' WHERE service_id = 21 AND day = 15;
UPDATE daily_data SET date = '2026-01-16' WHERE service_id = 21 AND day = 16;
UPDATE daily_data SET date = '2026-01-17' WHERE service_id = 21 AND day = 17;
UPDATE daily_data SET date = '2026-01-18' WHERE service_id = 21 AND day = 18;
UPDATE daily_data SET date = '2026-01-19' WHERE service_id = 21 AND day = 19;
UPDATE daily_data SET date = '2026-01-20' WHERE service_id = 21 AND day = 20;
UPDATE daily_data SET date = '2026-01-21' WHERE service_id = 21 AND day = 21;
UPDATE daily_data SET date = '2026-01-22' WHERE service_id = 21 AND day = 22;

-- Verification: Check converted dates
SELECT COUNT(*) as converted_count, MIN(date) as first_date, MAX(date) as last_date 
FROM daily_data 
WHERE service_id = 21 AND date LIKE '2026-%';
