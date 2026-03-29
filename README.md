<div align="center">

# 🚌 UNIBUS SCH

**순천향대학교 공식 버스 정보 앱**

[![React](https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vite.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com)
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white)](https://vercel.com)

[**라이브 데모 →**](https://unibus-sch-two.vercel.app)

</div>

---

## 📱 소개

UNIBUS SCH는 순천향대학교 학생과 교직원을 위한 버스 정보 앱입니다. 캠퍼스 셔틀과 통근버스 시간표를 실시간으로 확인하고, 근처 정류장을 지도에서 바로 볼 수 있습니다.

### 주요 기능

| 기능 | 설명 |
|------|------|
| 🗺️ **캠퍼스 셔틀** | Naver Maps 기반 실시간 지도 + 근처 정류장 바텀시트 |
| 🚌 **통근버스** | 인천·서울·경기 지역별 노선 및 시간표 |
| 📢 **공지사항** | 운행 변경·시스템 업데이트 실시간 알림 |
| ⚙️ **설정** | 한국어/영어 전환, 알림·위치 서비스 관리 |
| 🔐 **인증** | 이메일 기반 회원가입 및 로그인 |

---

## 🛠 기술 스택

**프론트엔드**
- React 18 + TypeScript + Vite
- Tailwind CSS (반응형, 최대 430px 모바일 레이아웃)
- Framer Motion (페이지 전환·스켈레톤 애니메이션)
- Naver Maps API (캠퍼스 지도)

**백엔드**
- Supabase (PostgreSQL DB, Auth, Storage)
- Supabase Edge Functions (Deno 런타임)

**배포**
- Vercel (프론트엔드 자동 배포)
- PWA 지원 (홈 화면 설치 가능)

---

## 🚀 로컬 개발 환경 실행

### 사전 준비

```bash
# 필수 도구 설치
brew install supabase/tap/supabase  # Supabase CLI
# Docker Desktop 설치 필수: https://www.docker.com/products/docker-desktop/
```

### 3단계로 실행하기

터미널 3개를 열고 순서대로 실행하세요.

**① Supabase 인프라 (DB, Auth)**
```bash
supabase start
```

**② 백엔드 API 서버**
```bash
supabase functions serve make-server --no-verify-jwt
# → http://localhost:54321/functions/v1/make-server
```

**③ 프론트엔드**
```bash
npm install
npm run dev
# → http://localhost:5173
```

---

## 📂 프로젝트 구조

```
unibus-sch/
├── src/
│   ├── app/
│   │   ├── screens/          # 페이지 컴포넌트
│   │   │   ├── HomeWrapper.tsx
│   │   │   ├── CampusShuttleWrapper.tsx
│   │   │   ├── CommuterBusWrapper.tsx
│   │   │   ├── NoticeWrapper.tsx
│   │   │   ├── SettingsWrapper.tsx
│   │   │   ├── LoginWrapper.tsx
│   │   │   └── SignUpWrapper.tsx
│   │   ├── components/       # 공통 컴포넌트
│   │   │   ├── BottomNav.tsx
│   │   │   ├── NaverMapComponent.tsx
│   │   │   └── SkeletonLoaders.tsx
│   │   ├── contexts/         # React Context (Auth, Language)
│   │   └── services/
│   │       └── api.ts        # 백엔드 API 통신
│   └── styles/
│       └── globals.css
└── supabase/
    ├── functions/
    │   └── make-server/
    │       └── index.ts      # Edge Function API 로직
    └── migrations/           # DB 스키마 마이그레이션
```

---

## 🤝 협업 가이드

### 브랜치 전략

```
main              ← 항상 배포 가능한 상태 유지
feat/기능명        ← 새 기능 개발
fix/버그명         ← 버그 수정
```

### 작업 흐름

1. `main`에서 새 브랜치 생성
2. 개발 후 Pull Request 생성
3. 팀원 코드 리뷰 → 승인 후 병합

### 담당 영역

| 역할 | 작업 폴더 |
|------|----------|
| 프론트엔드 | `src/app/screens/`, `src/app/components/` |
| 백엔드 | `supabase/functions/make-server/index.ts` |
| DB 설계 | `supabase/migrations/` |

---

## 💡 개발 팁

- **VS Code Deno 오류**: `Cmd+Shift+P` → `Deno: Initialize Workspace Configuration` 실행
- **백엔드 재시작 시 데이터 초기화**: 현재 일부 데이터는 메모리 기반이므로 서버 재시작 시 리셋됨
- **환경변수**: 프로덕션 DB 변수는 `.env` 파일 참고 (팀 내부 공유)
