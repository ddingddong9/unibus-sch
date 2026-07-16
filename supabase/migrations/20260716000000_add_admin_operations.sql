-- Operational data used by the admin response center.

CREATE TABLE IF NOT EXISTS user_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category VARCHAR(30) NOT NULL CHECK (category IN ('location', 'schedule', 'notification', 'login', 'lost', 'other')),
  title VARCHAR(160) NOT NULL,
  details TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
  related_bus_id VARCHAR(20) REFERENCES buses(id) ON DELETE SET NULL,
  related_route_id UUID REFERENCES routes(id) ON DELETE SET NULL,
  admin_note TEXT NOT NULL DEFAULT '',
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_reports_status_created
  ON user_reports(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_reports_user_created
  ON user_reports(user_id, created_at DESC);

DROP TRIGGER IF EXISTS user_reports_updated_at ON user_reports;
CREATE TRIGGER user_reports_updated_at
BEFORE UPDATE ON user_reports
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

ALTER TABLE user_reports ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS notification_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notice_id UUID REFERENCES notices(id) ON DELETE SET NULL,
  target VARCHAR(20) NOT NULL CHECK (target IN ('all', 'campus', 'commuter', 'system')),
  attempted INTEGER NOT NULL DEFAULT 0 CHECK (attempted >= 0),
  sent INTEGER NOT NULL DEFAULT 0 CHECK (sent >= 0),
  failed INTEGER NOT NULL DEFAULT 0 CHECK (failed >= 0),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_deliveries_created
  ON notification_deliveries(created_at DESC);
ALTER TABLE notification_deliveries ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS demo_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'failed')),
  snapshot JSONB NOT NULL DEFAULT '[]'::jsonb,
  plans JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_demo_sessions_one_active
  ON demo_sessions(status) WHERE status = 'active';
ALTER TABLE demo_sessions ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS admin_action_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(80) NOT NULL,
  target_type VARCHAR(40) NOT NULL,
  target_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_action_logs_created
  ON admin_action_logs(created_at DESC);
ALTER TABLE admin_action_logs ENABLE ROW LEVEL SECURITY;

-- Stop a bus and its active trip together so the driver and admin views cannot diverge.
CREATE OR REPLACE FUNCTION admin_force_stop_bus(target_bus_id VARCHAR)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  restore_route_id UUID;
BEGIN
  SELECT origin_route_id
    INTO restore_route_id
  FROM bus_trips
  WHERE bus_id = target_bus_id AND status = 'active'
  ORDER BY started_at DESC
  LIMIT 1;

  UPDATE bus_trips
  SET status = 'cancelled', ended_at = NOW()
  WHERE bus_id = target_bus_id AND status = 'active';

  UPDATE buses
  SET is_running = FALSE,
      current_driver_id = NULL,
      current_route_id = COALESCE(restore_route_id, current_route_id)
  WHERE id = target_bus_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Bus not found';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION admin_force_stop_bus(VARCHAR) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_force_stop_bus(VARCHAR) TO service_role;
