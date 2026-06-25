-- Add persistent bus-to-driver assignment separate from the current running driver.

ALTER TABLE buses
  ADD COLUMN IF NOT EXISTS assigned_driver_id UUID REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_buses_assigned_driver ON buses(assigned_driver_id);

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
  cu.name AS current_driver_name,
  cu.email AS current_driver_email,
  b.assigned_driver_id,
  du.name AS assigned_driver_name,
  du.email AS assigned_driver_email,
  b.created_at,
  b.updated_at,
  r.id AS route_id,
  r.name AS route_name,
  r.color AS route_color
FROM buses b
LEFT JOIN routes r ON b.current_route_id = r.id
LEFT JOIN users cu ON b.current_driver_id = cu.id
LEFT JOIN users du ON b.assigned_driver_id = du.id;
