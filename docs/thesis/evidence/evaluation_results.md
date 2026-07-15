# UNIBUS 기술 평가 원시 요약

## 1. 측정 기준

- 측정일: 2026-07-15 (KST)
- 기준 커밋: `4d393161c6ca8f35bef242060efeab6c7d8ef8bf`
- 운영체제: macOS 26.5 (Build 25F71)
- CPU: Apple M4
- 메모리: 16 GiB
- Node.js: v24.13.1
- npm: 11.8.0
- Vite: 7.3.6 (잠금 파일 해석 버전)
- Lighthouse: 13.4.0
- Supabase CLI: 2.75.0

결과는 별도 표시가 없는 한 로컬 production build와 연결된 원격 Supabase 프로젝트를 사용했다. 브라우저 성능 점수는 Lighthouse 기본 모바일 시뮬레이션 조건에서 얻은 사례 측정치이며 실제 모든 사용자 장치로 일반화하지 않는다.

## 2. 저장소 규모와 개발 이력

| 항목 | 결과 |
|---|---:|
| 전체 커밋 | 274 |
| 본격 개발 시작일(2026-03-02) 이후 커밋 | 261 |
| GitHub PR | 56 |
| 병합 PR | 53 |
| 닫힌 미병합 PR | 3 |
| 프론트엔드 TypeScript/TSX | 24,122 LOC |
| Edge Function TypeScript/TSX | 3,550 LOC |
| DB 마이그레이션 SQL | 1,180 LOC |
| CSS | 365 LOC |
| React 애플리케이션 경로 | 24 |
| 지연 로딩 화면 컴포넌트 | 21 |
| Edge Function HTTP 엔드포인트 | 39 |
| 고유 DB 테이블 | 12 |
| 마이그레이션 | 18 |

LOC는 빈 줄과 주석을 포함한 물리적 줄 수이다. 코드 품질이나 개인 기여량으로 해석하지 않고 시스템 규모 설명에만 사용한다. PR의 추가·삭제 줄 합계도 반복 수정과 되돌리기를 포함하므로 생산성 지표로 사용하지 않는다.

## 3. 정적 검사와 빌드

| 검사 | 명령 | 결과 |
|---|---|---|
| TypeScript | `npm run typecheck` | 통과, 오류 0 |
| ESLint | `npm run lint` | 통과, 오류 0 |
| Production build | `npm run build` | 통과, 2.68초 |
| 변환 모듈 | Vite build 출력 | 2,678개 |
| PWA precache | Vite PWA 출력 | 65개, 1,300.30 KiB |
| npm 취약 패키지 | `npm audit --json` | 0건(총 782 dependency records) |

### 3.1 주요 빌드 산출물

| 청크 | 원본 | gzip | 해석 |
|---|---:|---:|---|
| `campus-3d-vendor` | 944.52 kB | 256.47 kB | Three.js 계열, 최대 비용 |
| `react-vendor` | 254.46 kB | 81.31 kB | React·Router 런타임 |
| `supabase` | 211.22 kB | 54.96 kB | Supabase 클라이언트 |
| `Campus3DScene` | 166.37 kB | 59.66 kB | 학내순환 3D 장면 |
| `motion-vendor` | 114.30 kB | 37.78 kB | Framer Motion |
| `StationShuttle3DScene` | 56.61 kB | 22.10 kB | 신창역 셔틀 3D 장면 |
| 공통 CSS | 161.99 kB | 26.66 kB | 전체 스타일 |

3D 엔진은 별도 청크로 분리되어 일반 화면의 최초 실행에서 강제 로드되지 않는다. 다만 3D 진입 시 500 kB 경고 기준을 넘는 청크가 있으므로 후속 최적화 대상이다. 서비스 워커 precache에서도 독립 3D 페이지와 Three.js vendor 청크를 제외했다.

## 4. 알고리즘 시나리오 시험

실행 명령:

```bash
node --experimental-strip-types docs/thesis/evidence/run_algorithm_tests.mjs
```

| 영역 | 시험 수 | 통과 | 실패 |
|---|---:|---:|---:|
| 시간표·운행 규칙 | 7 | 7 | 0 |
| 경로 거리·방위·재표본화 | 5 | 5 | 0 |
| ETA 상태·계획 출발 반영 | 4 | 4 | 0 |
| 학내순환·신창역 시뮬레이션 | 5 | 5 | 0 |
| **합계** | **21** | **21** | **0** |

주요 경계조건은 다음과 같다.

- 학내순환의 10분 간격 출발과 정확한 경계 시각 직후 처리
- 후문 출발은 전철 출발 10분 전, 신창역 출발은 전철 도착 5분 후로 계산
- 마지막 당일 운행 이후 다음 날 첫 운행 선택
- 45초를 초과한 위치를 오래된 상태로 판정
- 역 대기 중 계획 출발 시간을 ETA에 합산
- 동일 입력에 동일한 시뮬레이션 결과 생성
- 24시간을 3분 간격으로 표본화해 학내순환 3대와 신창역 셔틀 좌표의 경계 이탈 여부 확인

이 시험은 합성 경로와 고정 시각을 사용한 소프트웨어 로직 시험이다. 실제 교통 정체나 GPS 오차에 대한 도착 예측 정확도를 의미하지 않는다.

## 5. DB와 API 검증

### 5.1 마이그레이션과 스키마

- `supabase migration list`: 로컬 18개와 원격 18개 이력 일치
- `supabase db lint --linked --level warning --fail-on error`: `public`, `extensions` 스키마 오류 없음
- 주요 데이터 구조: 사용자, 인증 토큰, 공지, 노선, 정류장, 경로 보정점, 버스, 위치 이력, 최신 상태, 운행 세션, 푸시 구독, 경로 캐시

### 5.2 비인가 API 시험

| 시험 | 기대 | 결과 |
|---|---:|---:|
| 공개 노선 조회 `GET /routes` | 200 | 200 |
| 비인가 사용자 관리 `GET /users` | 401 | 401 |
| 비인가 기사 상태 `GET /driver/status` | 401 | 401 |
| 비인가 노선 생성 `POST /routes` | 401 | 401 |
| 등록되지 않은 Origin의 CORS preflight | 미허용 | `Access-Control-Allow-Origin` 없음 |

### 5.3 anon key 직접 REST 시험

| 리소스 | HTTP 상태 | 노출 행 수(최대 1행 조회) |
|---|---:|---:|
| `users` | 200 | 0 |
| `auth_tokens` | 200 | 0 |
| `routes` | 200 | 1 |
| `bus_latest_state` | 200 | 0(측정 시 활성 데이터 없음) |
| `routes` INSERT | 401 | 해당 없음 |

PostgREST는 RLS로 행이 가려진 SELECT에 빈 배열과 HTTP 200을 반환할 수 있다. 따라서 HTTP 상태뿐 아니라 응답 배열 길이를 함께 확인했다.

## 6. Lighthouse 반복 측정

각 공개 경로를 production preview에서 5회씩 측정했다. 값은 중앙값이며 괄호는 최소~최대이다.

| 경로 | Performance | Accessibility | Best Practices | FCP | LCP | TBT | CLS | 전송량 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| `/onboarding` | 79 (77~81) | 100 | 100 | 3.678 s | 3.903 s | 0 ms | 0 | 417,477 B |
| `/campus-3d` | 73 (72~75) | 100 | 100 | 4.128 s | 4.654 s | 0 ms | 0 | 484,163 B |

### 6.1 해석

- 접근성 및 Best Practices 자동 검사에서 두 공개 화면 모두 100점을 기록했다.
- CLS와 TBT는 모든 반복에서 0으로 안정적이었지만, LCP는 두 화면 모두 개선 여지가 있다.
- 독립 3D 화면은 온보딩보다 LCP 중앙값이 약 0.751초 길고 Performance 중앙값이 6점 낮았다.
- 측정은 인증이 필요 없는 두 경로만 비교했다. 로그인 이후 주요 화면의 체감 성능은 별도 브라우저 시나리오와 정적 번들 분석으로 보완하며, 이 점수를 전체 앱 점수로 일반화하지 않는다.

## 7. 화면 증거

`docs/thesis/screenshots`에는 다음 실행 화면을 저장했다.

- 온보딩
- 홈과 신창역 전철 시간표
- 학내순환 3D
- 신창역 셔틀 3D
- 통학버스
- 공지사항
- 관리자 대시보드
- 관리자 노선 관리
- 관리자 3D 관리
- 기사 배차 선택

논문에는 개인 이메일, 학번, 토큰 또는 API 키가 보이지 않도록 필요한 부분을 자르고 비식별화한 사본만 삽입한다.
