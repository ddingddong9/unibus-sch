-- The app uses Edge Functions with the service role for user management.
-- Public REST access to users/auth tokens should stay closed.

ALTER TABLE auth_tokens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS auth_tokens_select_all ON auth_tokens;
DROP POLICY IF EXISTS auth_tokens_insert_all ON auth_tokens;
DROP POLICY IF EXISTS auth_tokens_update_all ON auth_tokens;
DROP POLICY IF EXISTS auth_tokens_delete_all ON auth_tokens;

DROP POLICY IF EXISTS users_select_all ON users;
DROP POLICY IF EXISTS users_update_own ON users;
DROP POLICY IF EXISTS users_admin_all ON users;
