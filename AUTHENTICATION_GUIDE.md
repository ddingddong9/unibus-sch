# 🔐 인증 시스템 가이드

SCH Shuttle 앱의 인증 시스템이 구현되어 있으며, 로그인하지 않으면 보호된 페이지에 접근할 수 없습니다.

---

## 🎯 구현된 기능

### ✅ 완료된 항목

1. **AuthContext** - 전역 인증 상태 관리
2. **ProtectedRoute** - 일반 사용자 인증 필요 페이지
3. **AdminRoute** - 관리자 권한 필요 페이지
4. **자동 리다이렉트** - 미인증 시 로그인 페이지로 이동
5. **로딩 상태** - 인증 확인 중 로딩 표시

---

## 📂 새로 추가된 파일

### 1. `/src/app/contexts/AuthContext.tsx`

**역할**: 전역 인증 상태 관리

```typescript
export function useAuth() {
  const context = useContext(AuthContext);
  return context;
}

// 제공하는 데이터 및 함수:
- user: User | null              // 현재 로그인한 사용자
- isAuthenticated: boolean       // 로그인 여부
- isLoading: boolean            // 인증 확인 중
- isAdmin: boolean              // 관리자 여부
- login(token, userData)        // 로그인
- logout()                      // 로그아웃
- checkAuth()                   // 인증 상태 재확인
```

**사용 예시**:
```typescript
const { user, isAuthenticated, isAdmin, logout } = useAuth();

if (isAuthenticated) {
  console.log('로그인한 사용자:', user.name);
}
```

---

### 2. `/src/app/components/ProtectedRoute.tsx`

**역할**: 로그인이 필요한 페이지 보호

**동작 방식**:
```
┌─────────────────────────────────────┐
│  사용자가 /home 접근 시도            │
└─────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│  ProtectedRoute 확인                │
│  - isLoading? → 로딩 화면           │
│  - isAuthenticated? → 페이지 표시   │
│  - 아니면 → /login 리다이렉트       │
└─────────────────────────────────────┘
```

**적용된 페이지**:
- ✅ `/home` - 홈
- ✅ `/campus-shuttle` - 캠퍼스 셔틀
- ✅ `/commuter-bus` - 통근버스
- ✅ `/qr-scanner` - QR 스캐너
- ✅ `/notice` - 공지사항
- ✅ `/settings` - 설정

---

### 3. `/src/app/components/AdminRoute.tsx`

**역할**: 관리자 권한이 필요한 페이지 보호

**동작 방식**:
```
┌─────────────────────────────────────┐
│  사용자가 /admin/dashboard 접근     │
└─────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│  AdminRoute 확인                    │
│  1. 로그인했는가?                   │
│     - 아니면 → /admin/login         │
│  2. 관리자인가?                     │
│     - 아니면 → 접근 거부 화면       │
│  3. 모두 통과 → 페이지 표시         │
└─────────────────────────────────────┘
```

**적용된 페이지**:
- ✅ `/admin/dashboard` - 관리자 대시보드
- ✅ `/admin/notices` - 공지사항 관리
- ✅ `/admin/routes` - 노선 관리
- ✅ `/admin/notifications` - 알림 전송

**접근 거부 시 화면**:
```
┌─────────────────────────────────────┐
│        ⚠️ 접근 권한 없음            │
│                                     │
│  관리자 권한이 필요합니다.           │
│  현재 계정: user@email.com          │
│           (일반 사용자)             │
│                                     │
│     [홈으로 돌아가기 버튼]           │
└─────────────────────────────────────┘
```

---

## 🔄 인증 흐름

### 1️⃣ 로그인 프로세스

```typescript
// LoginWrapper.tsx
const handleLogin = async () => {
  const result = await api.login(email, password);
  // ✅ AuthContext의 login() 호출
  login(result.token, result.user);
  navigate("/home");
};
```

**저장 위치**:
- `localStorage.auth_token` - JWT 토큰
- `localStorage.user` - 사용자 정보 (JSON)

---

### 2️⃣ 페이지 접근 시 확인

```typescript
// ProtectedRoute.tsx
export function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" />;
  
  return <>{children}</>;
}
```

---

### 3️⃣ 로그아웃 프로세스

```typescript
// SettingsWrapper.tsx
const handleLogout = async () => {
  await logout(); // AuthContext의 logout()
  navigate("/login");
};
```

**동작**:
1. 백엔드 API 호출 (`/auth/logout`)
2. 토큰 삭제 (서버 + localStorage)
3. 사용자 정보 삭제
4. 로그인 페이지로 이동

---

## 📊 라우트 보호 현황

| 경로 | 보호 유형 | 설명 |
|------|-----------|------|
| `/` | 공개 | 스플래시 화면 |
| `/onboarding` | 공개 | 온보딩 |
| `/login` | 공개 | 로그인 |
| `/signup` | 공개 | 회원가입 |
| `/home` | 🔒 ProtectedRoute | 로그인 필수 |
| `/campus-shuttle` | 🔒 ProtectedRoute | 로그인 필수 |
| `/commuter-bus` | 🔒 ProtectedRoute | 로그인 필수 |
| `/qr-scanner` | 🔒 ProtectedRoute | 로그인 필수 |
| `/notice` | 🔒 ProtectedRoute | 로그인 필수 |
| `/settings` | 🔒 ProtectedRoute | 로그인 필수 |
| `/admin/login` | 공개 | 관리자 로그인 |
| `/admin/dashboard` | 🔐 AdminRoute | 관리자 권한 필수 |
| `/admin/notices` | 🔐 AdminRoute | 관리자 권한 필수 |
| `/admin/routes` | 🔐 AdminRoute | 관리자 권한 필수 |
| `/admin/notifications` | 🔐 AdminRoute | 관리자 권한 필수 |

---

## 🎨 사용자 경험 (UX)

### ✅ 로그인 전

1. 앱 실행 → 스플래시 화면
2. 온보딩 화면
3. 로그인 화면
4. `/home` 접근 시도 → **자동으로 `/login`으로 리다이렉트**

### ✅ 로그인 후

1. 로그인 성공 → `/home` 이동
2. 모든 페이지 자유롭게 접근 가능
3. 하단 네비게이션으로 페이지 이동

### ✅ 로그아웃 시

1. 설정 → 로그아웃 버튼
2. 확인 대화상자: "로그아웃 하시겠습니까?"
3. 확인 → 로그인 페이지로 이동
4. 이후 보호된 페이지 접근 불가

### ✅ 관리자가 아닌 사용자가 관리자 페이지 접근 시

1. `/admin/dashboard` 접근
2. 로그인은 되어 있지만 관리자가 아님
3. **접근 권한 없음** 화면 표시
4. "홈으로 돌아가기" 버튼으로 복귀

---

## 🔧 개발자 가이드

### 새로운 보호된 페이지 추가하기

**일반 사용자 페이지:**
```typescript
// routes.tsx
{
  path: "/new-page",
  element: (
    <ProtectedRoute>
      <MobileLayout>
        <NewPageWrapper />
      </MobileLayout>
    </ProtectedRoute>
  ),
}
```

**관리자 전용 페이지:**
```typescript
// routes.tsx
{
  path: "/admin/new-feature",
  element: (
    <AdminRoute>
      <NewAdminFeature />
    </AdminRoute>
  ),
}
```

---

### 컴포넌트에서 인증 상태 사용하기

```typescript
import { useAuth } from '../contexts/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();

  if (!isAuthenticated) {
    return <div>로그인이 필요합니다.</div>;
  }

  return (
    <div>
      <h1>환영합니다, {user.name}님!</h1>
      {isAdmin && <AdminPanel />}
      <button onClick={logout}>로그아웃</button>
    </div>
  );
}
```

---

## 🔒 보안 고려사항

### ✅ 현재 구현된 보안

1. **토큰 기반 인증** - CSPRNG bearer token을 발급하고 서버에는 SHA-256 해시 저장
2. **프론트엔드 라우트 보호** - ProtectedRoute, AdminRoute
3. **백엔드 API 권한 확인** - `requireAuth`, `requireAdmin` 미들웨어
4. **관리자 권한 검증** - 서버에서 이중 확인
5. **비밀번호 해싱** - bcrypt 해시 저장
6. **토큰 만료 검사** - 서버에서 만료 시각과 현재 역할 확인
7. **CORS 제한** - 허용된 Origin만 응답

### ⚠️ 개선 필요한 보안 (향후 작업)

1. **세션 쿠키 전환** - localStorage bearer token을 HttpOnly·Secure·SameSite 쿠키로 이전
2. **로그인 시도 제한** - 계정/IP 기반 rate limiting 적용
3. **세션 수명 단축·회전** - 30일 고정 세션을 단기 access/회전 세션으로 개선
4. **보안 헤더 강화** - 서비스 연동 도메인을 반영한 CSP 적용

---

## 🧪 테스트 방법

### 1. 일반 사용자 로그인 테스트

```bash
# 1. 회원가입
POST /auth/signup
{
  "email": "<TEST_USER_EMAIL>",
  "password": "<TEST_USER_PASSWORD>",
  "name": "테스트",
  "studentId": "20240001"
}

# 2. 로그인
POST /auth/login
{
  "email": "<TEST_USER_EMAIL>",
  "password": "<TEST_USER_PASSWORD>"
}

# 3. /home 접근 → 성공
# 4. /admin/dashboard 접근 → 접근 거부
```

### 2. 관리자 로그인 테스트

```bash
# 1. 관리자 계정으로 로그인
POST /auth/login
{
  "email": "<ADMIN_EMAIL>",
  "password": "<ADMIN_PASSWORD>"
}

# 2. /home 접근 → 성공
# 3. /admin/dashboard 접근 → 성공
```

### 3. 미인증 접근 테스트

```bash
# 1. 로그아웃 상태에서
# 2. /home 직접 접근 → /login으로 리다이렉트
# 3. /admin/dashboard 직접 접근 → /admin/login으로 리다이렉트
```

---

## 📝 체크리스트

- [x] AuthContext 생성
- [x] ProtectedRoute 컴포넌트
- [x] AdminRoute 컴포넌트
- [x] App.tsx에 AuthProvider 적용
- [x] routes.tsx에 보호 적용
- [x] LoginWrapper에 AuthContext 연동
- [x] SettingsWrapper에 로그아웃 연동
- [x] 로딩 상태 UI
- [x] 접근 거부 UI (관리자 페이지)
- [x] 자동 리다이렉트

---

## 🎉 완료!

**이제 SCH Shuttle 앱은 완전한 인증 시스템을 갖추었습니다!**

- ✅ 로그인하지 않으면 보호된 페이지 접근 불가
- ✅ 관리자만 관리자 페이지 접근 가능
- ✅ 자동 리다이렉트 및 사용자 친화적 UI
- ✅ 전역 인증 상태 관리
- ✅ 안전한 로그아웃 처리
