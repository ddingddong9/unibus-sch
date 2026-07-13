-- Persist each real driver run so route direction and stop progress survive app restarts.
CREATE TABLE IF NOT EXISTS bus_trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_id VARCHAR(20) NOT NULL REFERENCES buses(id) ON DELETE CASCADE,
  route_id UUID REFERENCES routes(id) ON DELETE SET NULL,
  driver_id UUID REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  current_stop_order INTEGER NOT NULL DEFAULT 0 CHECK (current_stop_order >= 0),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bus_trips_bus_started
  ON bus_trips(bus_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_bus_trips_driver_started
  ON bus_trips(driver_id, started_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_bus_trips_one_active_bus
  ON bus_trips(bus_id) WHERE status = 'active';
CREATE UNIQUE INDEX IF NOT EXISTS idx_bus_trips_one_active_driver
  ON bus_trips(driver_id) WHERE status = 'active' AND driver_id IS NOT NULL;

DROP TRIGGER IF EXISTS bus_trips_updated_at ON bus_trips;
CREATE TRIGGER bus_trips_updated_at
BEFORE UPDATE ON bus_trips
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

ALTER TABLE bus_trips ENABLE ROW LEVEL SECURITY;
