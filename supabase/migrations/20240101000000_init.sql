-- ============================================================
-- SCH Shuttle App - 관계형 DB 마이그레이션 스크립트
-- ============================================================
-- 실행 방법: Supabase Dashboard → SQL Editor → 이 스크립트 복사 & 실행
-- ============================================================

-- ============================================================
-- 1단계: 기존 함수 생성 (테이블 생성 전에 필요)
-- ============================================================

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 2단계: 테이블 생성
-- ============================================================

-- ------------------------------------------------------------
-- users 테이블
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),  -- 카카오 로그인은 null 가능
  name VARCHAR(100) NOT NULL,
  student_id VARCHAR(50),
  role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'driver')),
  provider VARCHAR(20) DEFAULT 'local' CHECK (provider IN ('local', 'kakao', 'naver', 'google')),
  provider_id VARCHAR(255),  -- kakaoId 등
  profile_image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- users 인덱스
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_provider ON users(provider, provider_id);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);

-- 이메일 대소문자 구분 없는 유니크 인덱스
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_lower ON users(LOWER(email));

-- users 자동 updated_at 트리거
DROP TRIGGER IF EXISTS users_updated_at ON users;
CREATE TRIGGER users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- ------------------------------------------------------------
-- auth_tokens 테이블
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS auth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- auth_tokens 인덱스
CREATE INDEX IF NOT EXISTS idx_auth_tokens_user_id ON auth_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_tokens_token ON auth_tokens(token);
CREATE INDEX IF NOT EXISTS idx_auth_tokens_expires ON auth_tokens(expires_at);

ALTER TABLE auth_tokens ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- notices 테이블
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(50) NOT NULL DEFAULT 'general' CHECK (category IN ('general', 'route', 'system', 'lost')),
  priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_pinned BOOLEAN DEFAULT FALSE,
  view_count INTEGER DEFAULT 0,
  image_urls TEXT[] DEFAULT '{}',
  content_below TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- notices 인덱스
CREATE INDEX IF NOT EXISTS idx_notices_author_id ON notices(author_id);
CREATE INDEX IF NOT EXISTS idx_notices_category ON notices(category);
CREATE INDEX IF NOT EXISTS idx_notices_priority ON notices(priority);
CREATE INDEX IF NOT EXISTS idx_notices_created_at ON notices(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notices_pinned ON notices(is_pinned, created_at DESC);

-- notices 자동 updated_at 트리거
DROP TRIGGER IF EXISTS notices_updated_at ON notices;
CREATE TRIGGER notices_updated_at
BEFORE UPDATE ON notices
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- ------------------------------------------------------------
-- routes 테이블
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('shuttle', 'commute')),
  description TEXT,
  color VARCHAR(7) DEFAULT '#1E3B8A',
  region VARCHAR(100),
  schedule TEXT,
  duration VARCHAR(50),
  fare VARCHAR(50),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- routes 인덱스
CREATE INDEX IF NOT EXISTS idx_routes_type ON routes(type);
CREATE INDEX IF NOT EXISTS idx_routes_active ON routes(is_active);

-- routes 자동 updated_at 트리거
DROP TRIGGER IF EXISTS routes_updated_at ON routes;
CREATE TRIGGER routes_updated_at
BEFORE UPDATE ON routes
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- ------------------------------------------------------------
-- route_stops 테이블
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS route_stops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  stop_name VARCHAR(100) NOT NULL,
  stop_order INTEGER NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  arrival_time TIME,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- route_stops 인덱스
CREATE INDEX IF NOT EXISTS idx_route_stops_route_id ON route_stops(route_id);
CREATE INDEX IF NOT EXISTS idx_route_stops_order ON route_stops(route_id, stop_order);

-- 정류장 순서 유니크 제약
CREATE UNIQUE INDEX IF NOT EXISTS idx_route_stops_unique ON route_stops(route_id, stop_order);

-- ------------------------------------------------------------
-- route_shape_points 테이블 (승객에게 보이지 않는 경로 보정점)
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- buses 테이블
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS buses (
  id VARCHAR(20) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('shuttle', 'commute')),
  capacity INTEGER NOT NULL DEFAULT 45,
  license_plate VARCHAR(20),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
  current_route_id UUID REFERENCES routes(id) ON DELETE SET NULL,
  assigned_driver_id UUID REFERENCES users(id) ON DELETE SET NULL,
  is_running BOOLEAN DEFAULT FALSE,
  current_driver_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- buses 인덱스
CREATE INDEX IF NOT EXISTS idx_buses_type ON buses(type);
CREATE INDEX IF NOT EXISTS idx_buses_status ON buses(status);
CREATE INDEX IF NOT EXISTS idx_buses_route ON buses(current_route_id);
CREATE INDEX IF NOT EXISTS idx_buses_assigned_driver ON buses(assigned_driver_id);

-- buses 자동 updated_at 트리거
DROP TRIGGER IF EXISTS buses_updated_at ON buses;
CREATE TRIGGER buses_updated_at
BEFORE UPDATE ON buses
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- ------------------------------------------------------------
-- bus_locations 테이블
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bus_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_id VARCHAR(20) NOT NULL REFERENCES buses(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  speed DECIMAL(5, 2) DEFAULT 0,
  heading INTEGER DEFAULT 0,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- bus_locations 인덱스
CREATE INDEX IF NOT EXISTS idx_bus_locations_bus_id ON bus_locations(bus_id);
CREATE INDEX IF NOT EXISTS idx_bus_locations_timestamp ON bus_locations(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_bus_locations_latest ON bus_locations(bus_id, timestamp DESC);

-- 최신 버스 위치 뷰
CREATE OR REPLACE VIEW latest_bus_locations AS
SELECT DISTINCT ON (bus_id)
  id,
  bus_id,
  latitude,
  longitude,
  speed,
  heading,
  timestamp
FROM bus_locations
ORDER BY bus_id, timestamp DESC;

-- ============================================================
-- 3단계: 기존 데이터 마이그레이션 (프로덕션 전용, 로컬은 스킵)
-- ============================================================
-- 로컬 개발 환경에서는 kv_store 테이블이 없으므로 마이그레이션 생략
-- 프로덕션 마이그레이션 시에는 Supabase Dashboard SQL Editor에서 별도 실행

-- ============================================================
-- 4단계: 초기 데이터 삽입 (옵션)
-- ============================================================

-- 관리자 계정은 마이그레이션에 포함하지 않는다.
-- 배포 환경의 비밀값을 사용하는 관리자 생성 절차에서 별도로 등록한다.

-- 샘플 셔틀 노선
INSERT INTO routes (id, name, type, description, color, is_active)
VALUES 
  (gen_random_uuid(), '순환선 A', 'shuttle', '본관 → 공대 → 기숙사 순환', '#1E3B8A', true),
  (gen_random_uuid(), '순환선 B', 'shuttle', '기숙사 → 본관 → 공대 순환', '#DC2626', true),
  (gen_random_uuid(), '서울역 노선', 'commute', '학교 → 서울역', '#059669', true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 5단계: Row Level Security (RLS) 설정
-- ============================================================

-- users 테이블 RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 사용자 정보는 Edge Function 관리자 API를 통해서만 조회한다.
DROP POLICY IF EXISTS users_select_all ON users;

DROP POLICY IF EXISTS users_update_own ON users;

DROP POLICY IF EXISTS users_admin_all ON users;

-- notices 테이블 RLS
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 공지사항 조회 가능
DROP POLICY IF EXISTS notices_select_all ON notices;
CREATE POLICY notices_select_all ON notices
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS notices_admin_all ON notices;

-- buses 테이블 RLS
ALTER TABLE buses ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 버스 정보 조회 가능
DROP POLICY IF EXISTS buses_select_all ON buses;
CREATE POLICY buses_select_all ON buses
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS buses_admin_all ON buses;

-- bus_locations 테이블 RLS
ALTER TABLE bus_locations ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 버스 위치 조회 가능
DROP POLICY IF EXISTS bus_locations_select_all ON bus_locations;
CREATE POLICY bus_locations_select_all ON bus_locations
  FOR SELECT
  USING (true);

-- routes 테이블 RLS
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 노선 조회 가능
DROP POLICY IF EXISTS routes_select_all ON routes;
CREATE POLICY routes_select_all ON routes
  FOR SELECT
  USING (true);

-- route_stops 테이블 RLS
ALTER TABLE route_stops ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 정류장 조회 가능
DROP POLICY IF EXISTS route_stops_select_all ON route_stops;
CREATE POLICY route_stops_select_all ON route_stops
  FOR SELECT
  USING (true);

ALTER TABLE route_shape_points ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS route_shape_points_select_all ON route_shape_points;
CREATE POLICY route_shape_points_select_all ON route_shape_points
  FOR SELECT
  USING (true);

-- ============================================================
-- 6단계: 유용한 뷰 생성
-- ============================================================

-- 공지사항 + 작성자 정보 뷰
CREATE OR REPLACE VIEW notices_with_author AS
SELECT 
  n.id,
  n.title,
  n.content,
  n.category,
  n.priority,
  n.is_pinned,
  n.view_count,
  n.image_urls,
  n.content_below,
  n.created_at,
  n.updated_at,
  u.id AS author_id,
  u.name AS author_name,
  u.email AS author_email
FROM notices n
JOIN users u ON n.author_id = u.id;

-- 버스 + 현재 노선 정보 뷰
CREATE OR REPLACE VIEW buses_with_routes AS
SELECT 
  b.id,
  b.name,
  b.type,
  b.capacity,
  b.license_plate,
  b.status,
  b.assigned_driver_id,
  du.name AS assigned_driver_name,
  du.email AS assigned_driver_email,
  b.is_running,
  b.current_driver_id,
  cu.name AS current_driver_name,
  cu.email AS current_driver_email,
  b.created_at,
  b.updated_at,
  r.id AS route_id,
  r.name AS route_name,
  r.color AS route_color
FROM buses b
LEFT JOIN routes r ON b.current_route_id = r.id
LEFT JOIN users du ON b.assigned_driver_id = du.id
LEFT JOIN users cu ON b.current_driver_id = cu.id;

-- ============================================================
-- 7단계: 완료 확인
-- ============================================================

-- 데이터 확인
SELECT 'users' AS table_name, COUNT(*) AS count FROM users
UNION ALL
SELECT 'auth_tokens', COUNT(*) FROM auth_tokens
UNION ALL
SELECT 'notices', COUNT(*) FROM notices
UNION ALL
SELECT 'routes', COUNT(*) FROM routes
UNION ALL
SELECT 'route_stops', COUNT(*) FROM route_stops
UNION ALL
SELECT 'route_shape_points', COUNT(*) FROM route_shape_points
UNION ALL
SELECT 'buses', COUNT(*) FROM buses
UNION ALL
SELECT 'bus_locations', COUNT(*) FROM bus_locations;

-- ============================================================
-- 완료! 이제 백엔드 코드를 수정할 준비가 되었습니다.
-- ============================================================

-- 다음 단계:
-- 1. 위 스크립트 실행 결과 확인
-- 2. 백엔드 코드를 관계형 DB용으로 수정
-- 3. 테스트
