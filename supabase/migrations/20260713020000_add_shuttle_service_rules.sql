-- Make shuttle timetable semantics explicit and persist each trip's operating phase.
ALTER TABLE routes
  ADD COLUMN IF NOT EXISTS schedule_basis VARCHAR(30),
  ADD COLUMN IF NOT EXISTS interval_minutes INTEGER,
  ADD COLUMN IF NOT EXISTS departure_offset_minutes INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS boarding_wait_minutes INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS continuation_route_id UUID REFERENCES routes(id) ON DELETE SET NULL;

ALTER TABLE routes DROP CONSTRAINT IF EXISTS routes_schedule_basis_check;
ALTER TABLE routes ADD CONSTRAINT routes_schedule_basis_check CHECK (
  schedule_basis IS NULL
  OR schedule_basis IN ('bus_departure', 'train_departure', 'train_arrival')
);
ALTER TABLE routes DROP CONSTRAINT IF EXISTS routes_interval_minutes_check;
ALTER TABLE routes ADD CONSTRAINT routes_interval_minutes_check CHECK (
  interval_minutes IS NULL OR interval_minutes BETWEEN 1 AND 180
);
ALTER TABLE routes DROP CONSTRAINT IF EXISTS routes_departure_offset_minutes_check;
ALTER TABLE routes ADD CONSTRAINT routes_departure_offset_minutes_check CHECK (
  departure_offset_minutes BETWEEN 0 AND 120
);
ALTER TABLE routes DROP CONSTRAINT IF EXISTS routes_boarding_wait_minutes_check;
ALTER TABLE routes ADD CONSTRAINT routes_boarding_wait_minutes_check CHECK (
  boarding_wait_minutes BETWEEN 0 AND 120
);

UPDATE routes
SET
  schedule_basis = CASE shuttle_variant
    WHEN 'campus_to_station' THEN 'train_departure'
    WHEN 'station_to_campus' THEN 'train_arrival'
    WHEN 'station_to_campus_loop' THEN 'train_arrival'
    ELSE 'bus_departure'
  END,
  interval_minutes = CASE WHEN shuttle_variant = 'campus_loop' THEN 10 ELSE NULL END,
  departure_offset_minutes = CASE WHEN shuttle_variant = 'campus_to_station' THEN 10 ELSE 0 END,
  boarding_wait_minutes = CASE
    WHEN shuttle_variant IN ('station_to_campus', 'station_to_campus_loop') THEN 5
    ELSE 0
  END
WHERE type IN ('shuttle', 'campus');

UPDATE routes station_route
SET continuation_route_id = campus_route.id
FROM routes campus_route
WHERE station_route.shuttle_variant = 'station_to_campus_loop'
  AND campus_route.shuttle_variant = 'campus_loop'
  AND campus_route.is_active = true
  AND station_route.continuation_route_id IS NULL
  AND campus_route.id = (
    SELECT id
    FROM routes
    WHERE shuttle_variant = 'campus_loop' AND is_active = true
    ORDER BY CASE WHEN name = '학내순환' THEN 0 ELSE 1 END, created_at
    LIMIT 1
  );

ALTER TABLE bus_trips
  ADD COLUMN IF NOT EXISTS origin_route_id UUID REFERENCES routes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS service_phase VARCHAR(30) NOT NULL DEFAULT 'in_service',
  ADD COLUMN IF NOT EXISTS scheduled_event_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS planned_departure_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS one_loop_only BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE bus_trips DROP CONSTRAINT IF EXISTS bus_trips_service_phase_check;
ALTER TABLE bus_trips ADD CONSTRAINT bus_trips_service_phase_check CHECK (
  service_phase IN (
    'in_service',
    'waiting_station',
    'to_station',
    'to_campus',
    'campus_loop',
    'return_to_parking'
  )
);

UPDATE bus_trips
SET origin_route_id = route_id
WHERE origin_route_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_bus_trips_active_phase
  ON bus_trips(service_phase, updated_at DESC)
  WHERE status = 'active';

CREATE TABLE IF NOT EXISTS route_path_cache (
  route_id UUID PRIMARY KEY REFERENCES routes(id) ON DELETE CASCADE,
  input_hash TEXT NOT NULL,
  path JSONB NOT NULL DEFAULT '[]'::jsonb,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

ALTER TABLE route_path_cache ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS bus_latest_state (
  bus_id VARCHAR(20) PRIMARY KEY REFERENCES buses(id) ON DELETE CASCADE,
  trip_id UUID REFERENCES bus_trips(id) ON DELETE SET NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  speed DECIMAL(5, 2) NOT NULL DEFAULT 0,
  heading INTEGER NOT NULL DEFAULT 0,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  last_history_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE bus_latest_state ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS bus_latest_state_select_all ON bus_latest_state;
CREATE POLICY bus_latest_state_select_all ON bus_latest_state FOR SELECT USING (true);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'bus_latest_state'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE bus_latest_state;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION record_bus_location(
  p_bus_id VARCHAR,
  p_trip_id UUID,
  p_latitude DECIMAL,
  p_longitude DECIMAL,
  p_speed DECIMAL,
  p_heading INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now TIMESTAMP WITH TIME ZONE := NOW();
  v_last_history_at TIMESTAMP WITH TIME ZONE;
  v_sampled BOOLEAN := false;
BEGIN
  INSERT INTO bus_latest_state (
    bus_id, trip_id, latitude, longitude, speed, heading, timestamp
  ) VALUES (
    p_bus_id, p_trip_id, p_latitude, p_longitude, p_speed, p_heading, v_now
  )
  ON CONFLICT (bus_id) DO UPDATE SET
    trip_id = EXCLUDED.trip_id,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    speed = EXCLUDED.speed,
    heading = EXCLUDED.heading,
    timestamp = EXCLUDED.timestamp
  RETURNING last_history_at INTO v_last_history_at;

  IF v_last_history_at IS NULL OR v_last_history_at <= v_now - INTERVAL '30 seconds' THEN
    INSERT INTO bus_locations (bus_id, latitude, longitude, speed, heading, timestamp)
    VALUES (p_bus_id, p_latitude, p_longitude, p_speed, p_heading, v_now);
    UPDATE bus_latest_state SET last_history_at = v_now WHERE bus_id = p_bus_id;
    v_sampled := true;
  END IF;

  -- Amortized cleanup avoids requiring a separate scheduler while keeping 30 days of replay data.
  IF random() < 0.005 THEN
    DELETE FROM bus_locations WHERE timestamp < v_now - INTERVAL '30 days';
  END IF;

  RETURN v_sampled;
END;
$$;

REVOKE ALL ON FUNCTION record_bus_location(VARCHAR, UUID, DECIMAL, DECIMAL, DECIMAL, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION record_bus_location(VARCHAR, UUID, DECIMAL, DECIMAL, DECIMAL, INTEGER) TO service_role;
