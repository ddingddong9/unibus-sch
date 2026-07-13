-- Trip history is served only through authenticated server routes.
DROP POLICY IF EXISTS bus_trips_select_all ON bus_trips;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'bus_trips'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE bus_trips;
  END IF;
END $$;
