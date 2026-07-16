-- Rotate the previously shared bootstrap admin credential and invalidate every
-- session issued before the rotation. The replacement plaintext is never stored.

DO $$
DECLARE
  v_admin_id UUID;
BEGIN
  SELECT id
  INTO v_admin_id
  FROM public.users
  WHERE lower(email) = 'admin@sch.ac.kr'
    AND role = 'admin'
    AND provider = 'local'
  LIMIT 1;

  IF v_admin_id IS NULL THEN
    RAISE NOTICE 'Legacy bootstrap admin account was not found; no credential was rotated';
    RETURN;
  END IF;

  UPDATE public.users
  SET password_hash = '$2b$12$VfZ4VP.9qU3pdP/zq4WLWuRCYiVTIb1WZqJZWBJ4i5cUISOEU9i8a',
      updated_at = NOW()
  WHERE id = v_admin_id;

  DELETE FROM public.auth_tokens
  WHERE user_id = v_admin_id;

  INSERT INTO public.admin_action_logs (
    admin_id,
    action,
    target_type,
    target_id,
    metadata
  ) VALUES (
    NULL,
    'compromised_admin_credential_rotated',
    'user',
    v_admin_id::TEXT,
    jsonb_build_object('allSessionsRevoked', TRUE)
  );
END;
$$;
