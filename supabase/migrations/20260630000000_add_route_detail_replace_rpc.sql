-- Replace route stops and hidden shape points in a single database transaction.
CREATE OR REPLACE FUNCTION replace_route_details(
  p_route_id UUID,
  p_replace_stops BOOLEAN DEFAULT FALSE,
  p_stops JSONB DEFAULT '[]'::jsonb,
  p_replace_shape_points BOOLEAN DEFAULT FALSE,
  p_shape_points JSONB DEFAULT '[]'::jsonb
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM routes WHERE id = p_route_id) THEN
    RAISE EXCEPTION 'Route % not found', p_route_id USING ERRCODE = 'P0002';
  END IF;

  IF jsonb_typeof(COALESCE(p_stops, '[]'::jsonb)) <> 'array' THEN
    RAISE EXCEPTION 'p_stops must be a JSON array' USING ERRCODE = '22023';
  END IF;

  IF jsonb_typeof(COALESCE(p_shape_points, '[]'::jsonb)) <> 'array' THEN
    RAISE EXCEPTION 'p_shape_points must be a JSON array' USING ERRCODE = '22023';
  END IF;

  IF p_replace_stops THEN
    DELETE FROM route_stops WHERE route_id = p_route_id;

    INSERT INTO route_stops (
      route_id,
      stop_name,
      stop_order,
      latitude,
      longitude,
      arrival_time
    )
    SELECT
      p_route_id,
      NULLIF(TRIM(stop_item ->> 'name'), ''),
      COALESCE(NULLIF(stop_item ->> 'order', '')::INTEGER, stop_ordinality::INTEGER),
      CASE
        WHEN jsonb_typeof(stop_item -> 'lat') = 'number' THEN (stop_item ->> 'lat')::DECIMAL
        ELSE NULL
      END,
      CASE
        WHEN jsonb_typeof(stop_item -> 'lng') = 'number' THEN (stop_item ->> 'lng')::DECIMAL
        ELSE NULL
      END,
      NULLIF(stop_item ->> 'arrivalTime', '')::TIME
    FROM jsonb_array_elements(COALESCE(p_stops, '[]'::jsonb)) WITH ORDINALITY AS input(stop_item, stop_ordinality)
    WHERE NULLIF(TRIM(stop_item ->> 'name'), '') IS NOT NULL;
  END IF;

  IF p_replace_shape_points THEN
    DELETE FROM route_shape_points WHERE route_id = p_route_id;

    INSERT INTO route_shape_points (
      route_id,
      name,
      after_stop_order,
      point_order,
      latitude,
      longitude
    )
    SELECT
      p_route_id,
      COALESCE(NULLIF(TRIM(point_item ->> 'name'), ''), '경로 보정점'),
      COALESCE(
        NULLIF(point_item ->> 'afterStopOrder', '')::INTEGER,
        NULLIF(point_item ->> 'after_stop_order', '')::INTEGER,
        1
      ),
      COALESCE(
        NULLIF(point_item ->> 'order', '')::INTEGER,
        NULLIF(point_item ->> 'pointOrder', '')::INTEGER,
        point_ordinality::INTEGER
      ),
      (point_item ->> 'lat')::DECIMAL,
      (point_item ->> 'lng')::DECIMAL
    FROM jsonb_array_elements(COALESCE(p_shape_points, '[]'::jsonb)) WITH ORDINALITY AS input(point_item, point_ordinality)
    WHERE jsonb_typeof(point_item -> 'lat') = 'number'
      AND jsonb_typeof(point_item -> 'lng') = 'number';
  END IF;
END;
$$;
