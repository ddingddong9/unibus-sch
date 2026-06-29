-- Seed Shinchang station shuttle routes.
-- These routes stay editable from Admin > Bus route management.

ALTER TABLE routes DROP CONSTRAINT IF EXISTS routes_type_check;
ALTER TABLE routes ADD CONSTRAINT routes_type_check
  CHECK (type IN ('shuttle', 'commute', 'campus', 'commuter'));

INSERT INTO routes (id, name, type, description, color, region, schedule, duration, fare, is_active)
VALUES
  (
    '00000000-0000-0000-0000-000000000101',
    '신창역 셔틀 후문 -> 신창역',
    'shuttle',
    '신창역 지하철 출발 10분 전 후문 출발',
    '#2563EB',
    '신창역',
    '08:20, 09:20, 10:20, 11:20, 12:20, 13:20, 14:20, 15:20, 16:20, 17:20, 18:20, 19:20',
    '10분 전 출발',
    '무료',
    true
  ),
  (
    '00000000-0000-0000-0000-000000000102',
    '신창역 셔틀 신창역 -> 후문 종착',
    'shuttle',
    '신창역에서 후문까지 운행 후 종료',
    '#0F766E',
    '신창역',
    '08:05, 09:05, 10:05, 11:05, 12:05, 13:05, 14:05, 15:05, 16:05, 17:05, 18:05, 19:05',
    '약 7분',
    '무료',
    true
  ),
  (
    '00000000-0000-0000-0000-000000000103',
    '신창역 셔틀 신창역 -> 후문 -> 학내순환',
    'shuttle',
    '후문 도착 후 학내순환으로 연결',
    '#7C3AED',
    '신창역',
    '08:35, 09:35, 10:35, 11:35, 12:35, 13:35, 14:35, 15:35, 16:35, 17:35, 18:35, 19:35',
    '약 7분',
    '무료',
    true
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  type = EXCLUDED.type,
  description = EXCLUDED.description,
  color = EXCLUDED.color,
  region = EXCLUDED.region,
  schedule = EXCLUDED.schedule,
  duration = EXCLUDED.duration,
  fare = EXCLUDED.fare,
  is_active = EXCLUDED.is_active;

DELETE FROM route_stops
WHERE route_id IN (
  '00000000-0000-0000-0000-000000000101',
  '00000000-0000-0000-0000-000000000102',
  '00000000-0000-0000-0000-000000000103'
);

INSERT INTO route_stops (route_id, stop_name, stop_order, latitude, longitude)
VALUES
  ('00000000-0000-0000-0000-000000000101', '후문', 1, 36.77276000, 126.93381600),
  ('00000000-0000-0000-0000-000000000101', '신창역', 2, 36.76963000, 126.95081000),

  ('00000000-0000-0000-0000-000000000102', '신창역', 1, 36.76963000, 126.95081000),
  ('00000000-0000-0000-0000-000000000102', '후문', 2, 36.77276000, 126.93381600),

  ('00000000-0000-0000-0000-000000000103', '신창역', 1, 36.76963000, 126.95081000),
  ('00000000-0000-0000-0000-000000000103', '후문', 2, 36.77276000, 126.93381600),
  ('00000000-0000-0000-0000-000000000103', '향3', 3, 36.76822800, 126.93538300),
  ('00000000-0000-0000-0000-000000000103', '향1', 4, 36.76790500, 126.93250500),
  ('00000000-0000-0000-0000-000000000103', '도서관', 5, 36.76885600, 126.93130300),
  ('00000000-0000-0000-0000-000000000103', '정문', 6, 36.76901400, 126.92797800);
