-- Aligns the schema with what the backend code already reads and writes.

-- 1. USERS: role and status. UserRepository saves both since the auth PR; without these
--    columns every registration insert fails.
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'participant',
    ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'activ';

ALTER TABLE users
    ADD CONSTRAINT users_role_check CHECK (role IN ('participant', 'organizator')),
    ADD CONSTRAINT users_status_check CHECK (status IN ('activ', 'inactiv'));

-- 2. EVENTS: fields collected by POST /api/evenimente (categorie, loc, numar_locuri, poza).
--    The form takes a free-text place and only a start time, so venue_id and end_time
--    become optional until venues and end times are part of the API.
ALTER TABLE events
    ALTER COLUMN venue_id DROP NOT NULL,
    ALTER COLUMN end_time DROP NOT NULL,
    ADD COLUMN IF NOT EXISTS category VARCHAR(50),
    ADD COLUMN IF NOT EXISTS location VARCHAR(100),
    ADD COLUMN IF NOT EXISTS capacity INTEGER,
    ADD COLUMN IF NOT EXISTS image_url TEXT,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL;

ALTER TABLE events
    ADD CONSTRAINT events_capacity_check CHECK (capacity IS NULL OR capacity BETWEEN 1 AND 10000),
    ADD CONSTRAINT events_end_after_start_check CHECK (end_time IS NULL OR end_time > start_time);
