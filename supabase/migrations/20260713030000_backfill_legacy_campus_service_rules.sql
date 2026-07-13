-- Some older production rows use type='campus' instead of type='shuttle'.
-- Backfill their canonical loop variant before linking station continuation routes.
UPDATE routes
SET
  shuttle_variant = 'campus_loop',
  schedule_basis = 'bus_departure',
  interval_minutes = COALESCE(interval_minutes, 10),
  departure_offset_minutes = 0,
  boarding_wait_minutes = 0
WHERE type IN ('shuttle', 'campus')
  AND shuttle_variant IS NULL
  AND NOT (
    name ~ '신창|순천향대역|순천향대학교역'
    OR COALESCE(description, '') ~ '신창|순천향대역|순천향대학교역'
    OR COALESCE(region, '') ~ '신창|순천향대역|순천향대학교역'
  );

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
