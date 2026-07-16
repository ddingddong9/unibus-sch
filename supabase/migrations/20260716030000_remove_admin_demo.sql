-- Remove the redundant admin-operated bus demo.
-- Restore bus state first if a demo session was left active, then remove its data.
DO $$
DECLARE
  active_snapshot JSONB;
BEGIN
  IF to_regclass('public.demo_sessions') IS NULL THEN
    RETURN;
  END IF;

  SELECT snapshot
    INTO active_snapshot
    FROM public.demo_sessions
   WHERE status = 'active'
   ORDER BY started_at DESC
   LIMIT 1;

  IF active_snapshot IS NOT NULL AND jsonb_typeof(active_snapshot) = 'array' THEN
    UPDATE public.buses AS bus
       SET type = restored.type,
           status = restored.status,
           current_route_id = NULLIF(restored."currentRouteId", '')::UUID,
           assigned_driver_id = NULLIF(restored."assignedDriverId", '')::UUID,
           current_driver_id = NULLIF(restored."currentDriverId", '')::UUID,
           is_running = COALESCE(restored."isRunning", false),
           updated_at = NOW()
      FROM jsonb_to_recordset(active_snapshot) AS restored(
        "busId" TEXT,
        type TEXT,
        status TEXT,
        "currentRouteId" TEXT,
        "assignedDriverId" TEXT,
        "currentDriverId" TEXT,
        "isRunning" BOOLEAN
      )
     WHERE bus.id::TEXT = restored."busId";
  END IF;
END
$$;

DROP TABLE IF EXISTS public.demo_sessions;
