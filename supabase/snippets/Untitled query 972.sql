-- Generăm 50 de utilizatori fictivi instant
INSERT INTO users (email, password_hash, first_name, last_name, birth_date, phone)
SELECT 
    'user' || i || '@example.com',
    'scrypt:32768:8:1$vXhY7...fakehash', -- hash generat
    'Prenume' || i,
    'Nume' || i,
    CASE 
        WHEN i % 2 = 0 THEN '1995-04-12'::date 
        ELSE '2001-09-23'::date 
    END,
    '0722' || LPAD(i::text, 6, '0')
FROM generate_series(1, 50) AS i;

-- Generăm 10 locații (venues) fictive
INSERT INTO venues (name, city, address, capacity)
SELECT 
    'Locația Sălii ' || i,
    CASE WHEN i % 2 = 0 THEN 'Cluj-Napoca' ELSE 'București' END,
    'Strada API Nr. ' || i,
    i * 100
FROM generate_series(1, 10) AS i;
