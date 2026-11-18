ALTER TABLE organizer_requests
    ADD COLUMN IF NOT EXISTS rejection_reason VARCHAR(300);

CREATE OR REPLACE FUNCTION aproba_cerere_organizator(p_cerere_id INTEGER)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    v_user_id INTEGER;
BEGIN
    UPDATE organizer_requests
       SET status = 'aprobata'
     WHERE id = p_cerere_id AND status = 'in_asteptare'
    RETURNING user_id INTO v_user_id;

    IF v_user_id IS NULL THEN
        IF EXISTS (SELECT 1 FROM organizer_requests WHERE id = p_cerere_id) THEN
            RETURN 'deja_rezolvata';
        END IF;
        RETURN 'negasita';
    END IF;

    UPDATE users SET role = 'organizator' WHERE id = v_user_id AND role = 'participant';
    RETURN 'aprobata';
END;
$$;

REVOKE EXECUTE ON FUNCTION aproba_cerere_organizator(INTEGER) FROM PUBLIC;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        REVOKE EXECUTE ON FUNCTION aproba_cerere_organizator(INTEGER) FROM anon, authenticated;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
        GRANT EXECUTE ON FUNCTION aproba_cerere_organizator(INTEGER) TO service_role;
    END IF;
END;
$$;