-- route_stops의 위도/경도를 nullable로 변경
-- 관리자 UI에서 정류장 이름만 입력할 수 있으므로 좌표는 선택 사항

ALTER TABLE route_stops
  ALTER COLUMN latitude DROP NOT NULL,
  ALTER COLUMN longitude DROP NOT NULL;
