-- Lock every table to the backend.
--
-- Supabase exposes public tables through its REST API to anyone holding the anon key,
-- which is meant to be public. Without RLS that includes users.password_hash.
-- Enabling RLS with no policies denies the anon and authenticated roles entirely;
-- the Flask backend connects with the service_role key, which bypasses RLS.

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
