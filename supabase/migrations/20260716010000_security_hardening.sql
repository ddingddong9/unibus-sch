-- Security hardening for API throttling, private operational views, and uploads.

CREATE TABLE IF NOT EXISTS api_rate_limits (
  rate_key TEXT PRIMARY KEY,
  window_started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  request_count INTEGER NOT NULL DEFAULT 0 CHECK (request_count >= 0),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

ALTER TABLE api_rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE api_rate_limits FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE api_rate_limits TO service_role;

CREATE OR REPLACE FUNCTION consume_api_rate_limit(
  p_rate_key TEXT,
  p_max_requests INTEGER,
  p_window_seconds INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now TIMESTAMP WITH TIME ZONE := NOW();
  v_count INTEGER;
BEGIN
  IF p_rate_key IS NULL
    OR length(p_rate_key) <> 64
    OR p_max_requests NOT BETWEEN 1 AND 10000
    OR p_window_seconds NOT BETWEEN 1 AND 86400 THEN
    RETURN FALSE;
  END IF;

  INSERT INTO api_rate_limits (rate_key, window_started_at, request_count, updated_at)
  VALUES (p_rate_key, v_now, 1, v_now)
  ON CONFLICT (rate_key) DO UPDATE SET
    request_count = CASE
      WHEN api_rate_limits.window_started_at <= v_now - make_interval(secs => p_window_seconds) THEN 1
      ELSE api_rate_limits.request_count + 1
    END,
    window_started_at = CASE
      WHEN api_rate_limits.window_started_at <= v_now - make_interval(secs => p_window_seconds) THEN v_now
      ELSE api_rate_limits.window_started_at
    END,
    updated_at = v_now
  RETURNING request_count INTO v_count;

  IF random() < 0.01 THEN
    DELETE FROM api_rate_limits WHERE updated_at < v_now - INTERVAL '24 hours';
  END IF;

  RETURN v_count <= p_max_requests;
END;
$$;

REVOKE ALL ON FUNCTION consume_api_rate_limit(TEXT, INTEGER, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION consume_api_rate_limit(TEXT, INTEGER, INTEGER) TO service_role;

-- Remove e-mail addresses that no application response needs, then keep the
-- operational views private to the Edge Function service role.
DROP VIEW IF EXISTS public.notices_with_author;
CREATE VIEW public.notices_with_author AS
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
  u.name AS author_name
FROM public.notices n
JOIN public.users u ON n.author_id = u.id;

DROP VIEW IF EXISTS public.buses_with_routes;
CREATE VIEW public.buses_with_routes AS
SELECT
  b.id,
  b.name,
  b.type,
  b.capacity,
  b.license_plate,
  b.status,
  b.is_running,
  b.current_driver_id,
  cu.name AS current_driver_name,
  b.assigned_driver_id,
  du.name AS assigned_driver_name,
  b.created_at,
  b.updated_at,
  r.id AS route_id,
  r.name AS route_name,
  r.color AS route_color
FROM public.buses b
LEFT JOIN public.routes r ON b.current_route_id = r.id
LEFT JOIN public.users cu ON b.current_driver_id = cu.id
LEFT JOIN public.users du ON b.assigned_driver_id = du.id;

REVOKE ALL ON public.notices_with_author FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.buses_with_routes FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.notices_with_author TO service_role;
GRANT SELECT ON public.buses_with_routes TO service_role;

-- The buses table contains licence plates and driver identifiers. Public clients
-- receive a redacted response from the Edge API instead of selecting it directly.
DROP POLICY IF EXISTS buses_select_all ON public.buses;
REVOKE SELECT ON public.buses FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.buses TO service_role;

-- Historical GPS traces are operational data. Only the current state remains
-- public for realtime tracking; history is served through privileged APIs only.
DROP POLICY IF EXISTS bus_locations_select_all ON public.bus_locations;
REVOKE SELECT ON public.bus_locations FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.bus_locations TO service_role;
REVOKE ALL ON public.latest_bus_locations FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.latest_bus_locations TO service_role;

-- Enforce the same restrictions at the Storage boundary as the upload route.
UPDATE storage.buckets
SET file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
WHERE id = 'notice-images';
