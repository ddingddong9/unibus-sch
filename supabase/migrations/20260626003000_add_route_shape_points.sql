-- Hidden route shaping points used for Directions API path correction.
-- These points are not passenger-facing stops.

CREATE TABLE IF NOT EXISTS route_shape_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  name VARCHAR(100),
  after_stop_order INTEGER NOT NULL,
  point_order INTEGER NOT NULL DEFAULT 1,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_route_shape_points_route_id ON route_shape_points(route_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_route_shape_points_order
  ON route_shape_points(route_id, after_stop_order, point_order);

DROP TRIGGER IF EXISTS route_shape_points_updated_at ON route_shape_points;
CREATE TRIGGER route_shape_points_updated_at
BEFORE UPDATE ON route_shape_points
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

ALTER TABLE route_shape_points ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS route_shape_points_select_all ON route_shape_points;
CREATE POLICY route_shape_points_select_all ON route_shape_points
  FOR SELECT USING (true);

INSERT INTO route_shape_points (route_id, name, after_stop_order, point_order, latitude, longitude)
SELECT id, '정문 진입로', 4, 1, 36.768960, 126.929760
FROM routes
WHERE name = '학내순환'
ON CONFLICT (route_id, after_stop_order, point_order) DO UPDATE SET
  name = EXCLUDED.name,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude;
