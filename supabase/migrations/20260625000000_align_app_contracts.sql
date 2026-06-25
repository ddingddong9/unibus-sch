-- Align DB constraints and views with the current app/API contract.

ALTER TABLE notices DROP CONSTRAINT IF EXISTS notices_category_check;
UPDATE notices
SET category = CASE category
  WHEN 'important' THEN 'route'
  WHEN 'event' THEN 'general'
  WHEN 'maintenance' THEN 'system'
  ELSE category
END
WHERE category IN ('important', 'event', 'maintenance');

ALTER TABLE notices ADD CONSTRAINT notices_category_check
  CHECK (category IN ('general', 'route', 'system', 'lost'));

ALTER TABLE notices ADD COLUMN IF NOT EXISTS image_urls TEXT[] DEFAULT '{}';
ALTER TABLE notices ADD COLUMN IF NOT EXISTS content_below TEXT DEFAULT '';

ALTER TABLE routes ADD COLUMN IF NOT EXISTS region VARCHAR(100);
ALTER TABLE routes ADD COLUMN IF NOT EXISTS schedule TEXT;
ALTER TABLE routes ADD COLUMN IF NOT EXISTS duration VARCHAR(50);
ALTER TABLE routes ADD COLUMN IF NOT EXISTS fare VARCHAR(50);

ALTER TABLE buses ADD COLUMN IF NOT EXISTS is_running BOOLEAN DEFAULT FALSE;
ALTER TABLE buses ADD COLUMN IF NOT EXISTS current_driver_id UUID REFERENCES users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_buses_running ON buses(is_running);

UPDATE users
SET password_hash = '$2a$10$ESjDbWfCsrJi0liWDS.0P.c1KPMFjSGdfBNxZsTBeCxUJZh/BCH6O'
WHERE email = 'admin@sch.ac.kr'
  AND password_hash = 'admin123';

ALTER TABLE auth_tokens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS auth_tokens_select_all ON auth_tokens;
DROP POLICY IF EXISTS auth_tokens_insert_all ON auth_tokens;
DROP POLICY IF EXISTS auth_tokens_update_all ON auth_tokens;
DROP POLICY IF EXISTS auth_tokens_delete_all ON auth_tokens;

DROP POLICY IF EXISTS users_admin_all ON users;
DROP POLICY IF EXISTS notices_admin_all ON notices;
DROP POLICY IF EXISTS buses_admin_all ON buses;

DROP VIEW IF EXISTS notices_with_author;
CREATE OR REPLACE VIEW notices_with_author AS
SELECT
  n.id,
  n.title,
  n.content,
  n.category,
  n.priority,
  n.is_pinned,
  n.view_count,
  n.image_urls,
  n.content_below,
  n.created_at,
  n.updated_at,
  u.id AS author_id,
  u.name AS author_name,
  u.email AS author_email
FROM notices n
JOIN users u ON n.author_id = u.id;

DROP VIEW IF EXISTS buses_with_routes;
CREATE OR REPLACE VIEW buses_with_routes AS
SELECT
  b.id,
  b.name,
  b.type,
  b.capacity,
  b.license_plate,
  b.status,
  b.is_running,
  b.current_driver_id,
  b.created_at,
  b.updated_at,
  r.id AS route_id,
  r.name AS route_name,
  r.color AS route_color
FROM buses b
LEFT JOIN routes r ON b.current_route_id = r.id;

DROP POLICY IF EXISTS "notice_images_anon_upload" ON storage.objects;
