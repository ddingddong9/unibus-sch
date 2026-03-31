# 🚌 UNIBUS 프로젝트 가이드 (로컬 개발 및 협업)

이 프로젝트는 **React(Vite)** 기반의 프론트엔드와 **Supabase Edge Functions(Deno)** 기반의 백엔드로 구성된 통합 저장소입니다.

---

## 🛠 1. 개발 환경 준비 (Prerequisites)

개발을 시작하기 전에 다음 도구들이 설치되어 있어야 합니다.
*   **Docker Desktop**: 데이터베이스와 로컬 인프라 실행을 위해 필수입니다. ([다운로드](https://www.docker.com/products/docker-desktop/))
*   **Supabase CLI**: 백엔드 관리를 위한 도구입니다. (`brew install supabase/tap/supabase`)
*   **Node.js**: 프론트엔드 실행을 위해 필요합니다.

---

## 🚀 2. 로컬 서버 실행 순서 (3개의 터미널 필요)

모든 명령어는 **프로젝트 루트 디렉토리**(`unibus-local/`)에서 실행하세요.

### 1단계: Supabase 인프라 실행 (DB, Auth 등)
데이터베이스와 인증 서버를 로컬 Docker 컨테이너로 띄웁니다.
```bash
supabase start
```
*   **역할**: 로컬 DB, 사용자 인증(Auth), 스토리지 등의 인프라를 구축합니다.

### 2단계: 백엔드 API 서버 실행 (Edge Functions)
우리가 작성한 서버 로직(`index.ts`)을 로컬 API 주소로 서빙합니다.
```bash
supabase functions serve make-server --no-verify-jwt
```
*   **역할**: `http://localhost:54321/functions/v1/make-server` 주소로 백엔드 API를 활성화합니다.
*   **파일 위치 이동**: `cd supabase/functions/make-server` (백엔드 코드 확인 시)

### 3단계: 프론트엔드 실행 (React/Vite)
실제 웹 화면을 브라우저에 띄웁니다.
```bash
npm run dev
```
*   **역할**: 웹 화면 UI를 실행하며, 기본 주소는 `http://localhost:5173`입니다.
*   **파일 위치 이동**: `cd src` (프론트엔드 코드 확인 시)

---

## 📂 3. 프로젝트 구조 및 협업 역할

이 프로젝트는 하나의 저장소에서 프론트엔드와 백엔드를 모두 관리하는 **모노레포(Monorepo)** 구조입니다.

### 🎨 프론트엔드 개발자 (Frontend)
*   **주요 작업 폴더**: `src/`
    *   `src/app/screens/`: 사용자 페이지 UI 작업
    *   `src/app/admin/`: 관리자 페이지 UI 작업
    *   `src/app/services/api.ts`: 백엔드 API와 통신하는 코드 작성
*   **이동 명령어**: `cd src`

### ⚙️ 백엔드 개발자 (Backend)
*   **주요 작업 폴더**: `supabase/`
    *   `supabase/functions/make-server/index.ts`: API 비즈니스 로직 작성 (회원가입, 데이터 처리 등)
    *   `supabase/migrations/`: 데이터베이스 테이블 설계 및 관리
*   **이동 명령어**: `cd supabase/functions/make-server`

---

## 🤝 4. 깃허브 협업 방식

1.  **메인 브랜치 관리**: `main` 브랜치는 항상 실행 가능한 상태를 유지합니다.
2.  **브랜치 전략**: 각자 맡은 역할에 따라 브랜치를 만들어 작업하세요.
    *   예: `feat/frontend-login`, `feat/backend-api`
3.  **병합(Merge)**: 작업이 완료되면 **Pull Request (PR)**를 생성하여 팀원과 코드 리뷰를 거친 후 병합합니다.

---

## 💡 팁
*   **데이터 유지**: 현재 백엔드는 메모리 저장 방식을 사용하므로, `supabase functions serve`를 껐다가 켜면 데이터가 초기화됩니다.
*   **에디터 오류**: VS Code에서 `Deno` 관련 빨간 줄이 뜨면 `Command + Shift + P`를 눌러 `Deno: Initialize Workspace Configuration`을 실행하세요.
