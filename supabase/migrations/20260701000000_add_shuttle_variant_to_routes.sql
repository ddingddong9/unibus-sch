ALTER TABLE routes
  ADD COLUMN IF NOT EXISTS shuttle_variant VARCHAR(40);

ALTER TABLE routes
  DROP CONSTRAINT IF EXISTS routes_shuttle_variant_check;

ALTER TABLE routes
  ADD CONSTRAINT routes_shuttle_variant_check
  CHECK (
    shuttle_variant IS NULL
    OR shuttle_variant IN (
      'campus_loop',
      'campus_to_station',
      'station_to_campus',
      'station_to_campus_loop'
    )
  );

UPDATE routes
SET shuttle_variant = CASE
  WHEN type = 'shuttle'
    AND (
      name ~ '신창|순천향대역|순천향대학교역'
      OR COALESCE(description, '') ~ '신창|순천향대역|순천향대학교역'
      OR COALESCE(region, '') ~ '신창|순천향대역|순천향대학교역'
    )
    AND (
      name ~ '학내순환|순환|연결'
      OR COALESCE(description, '') ~ '학내순환|순환|연결'
    )
    THEN 'station_to_campus_loop'
  WHEN type = 'shuttle'
    AND (
      name ~ '후문.*신창|학교.*신창'
      OR COALESCE(description, '') ~ '후문.*신창|학교.*신창'
    )
    THEN 'campus_to_station'
  WHEN type = 'shuttle'
    AND (
      name ~ '신창|순천향대역|순천향대학교역'
      OR COALESCE(description, '') ~ '신창|순천향대역|순천향대학교역'
      OR COALESCE(region, '') ~ '신창|순천향대역|순천향대학교역'
    )
    THEN 'station_to_campus'
  WHEN type = 'shuttle' THEN 'campus_loop'
  ELSE NULL
END
WHERE shuttle_variant IS NULL;
