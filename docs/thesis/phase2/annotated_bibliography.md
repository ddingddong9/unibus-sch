# 2단계 문헌조사 및 출처 검증

## 1. 조사 범위와 절차

이 조사는 체계적 문헌고찰이 아니라 UNIBUS 프로토타입의 설계와 평가를 뒷받침하기 위한 표적 범위 문헌조사(targeted scoping review)다. 검색일은 2026년 7월 15일이며, Crossref REST API, 원 출판사 페이지, 학회·대학 기관 저장소, 국제 표준 및 공식 기술 문서를 사용했다.

검색어는 다음 네 묶음으로 구성했다.

1. `campus shuttle bus tracking GPS`, `university shuttle management application`
2. `bus arrival time prediction GPS AVL`, `map matching sparse GPS`
3. `digital twin smart campus mobility 3D`, `3D WebGIS campus digital twin`
4. `GTFS Realtime best practices`, `PWA service worker manifest`, `row level security`, `web session localStorage`

포함 기준은 (1) 동료심사를 거친 원 연구 또는 공신력 있는 학회 논문, (2) 공식 표준·보안 지침·제품 문서, (3) DOI 또는 영구 URL로 서지사항을 검증할 수 있는 자료, (4) 셔틀 운영·도착 예측·디지털 트윈·PWA·보안 중 하나 이상에 직접 관련된 자료다. 블로그 요약, 출처가 불명확한 학생 보고서, 단순 홍보 페이지, UNIBUS의 기능과 직접 연결되지 않는 일반 스마트 교실 연구는 제외했다. 서지정보는 DOI 메타데이터와 원문 페이지를 교차 확인했다.

## 2. 주석 문헌 목록

### A. 연구 설계

**R01. Hevner, A. R., March, S. T., Park, J., & Ram, S. (2004). Design science in information systems research. _MIS Quarterly, 28_(1), 75-105. https://doi.org/10.2307/25148625**

- 정보시스템 인공물의 구축과 평가를 연구 기여로 다루는 설계과학의 핵심 틀을 제시한다.
- UNIBUS를 단순 제작 결과가 아니라 문제 적합성, 설계 인공물, 평가 증거로 설명하는 이론적 근거로 사용한다.
- 이 자료는 UNIBUS 자체의 효과나 사용자 만족도를 입증하지 않는다.

**R02. Peffers, K., Tuunanen, T., Rothenberger, M. A., & Chatterjee, S. (2007). A design science research methodology for information systems research. _Journal of Management Information Systems, 24_(3), 45-77. https://doi.org/10.2753/MIS0742-1222240302**

- 문제 인식, 해결 목표, 설계·개발, 시연, 평가, 의사소통으로 이어지는 DSRM 절차를 제시한다.
- 실제 운행 실험이 제한된 상황에서 프로토타입 구축, 시나리오 검증, 정량 측정을 결합하는 연구 절차의 근거다.
- 현장 사용자 평가를 대체할 수 있다고 주장하지 않으며, 시연과 운영 검증을 구분하는 데 사용한다.

### B. 실시간 위치와 도착시간 예측

**R03. Lin, W.-H., & Zeng, J. (1999). Experimental study of real-time bus arrival time prediction with GPS data. _Transportation Research Record, 1666_(1), 101-109. https://doi.org/10.3141/1666-12**

- GPS 자료의 선별, 노선 표현, 운행·정차시간을 활용한 실시간 버스 도착 예측을 실험했다.
- 위치 자료만 표시하는 것과 도착시간을 예측하는 것이 다른 문제임을 설명하는 초기 근거다.
- 특정 실험 노선의 결과이므로 순천향대학교 셔틀의 정확도로 일반화하지 않는다.

**R04. Dailey, D. J., Maclean, S. D., Cathey, F. W., & Wall, Z. R. (2001). Transit vehicle arrival prediction: Algorithm and large-scale implementation. _Transportation Research Record, 1771_(1), 46-51. https://doi.org/10.3141/1771-06**

- 자동 차량 위치 자료, 과거 통계, 필터를 결합한 도착 예측과 대규모 구현 사례를 다룬다.
- 향후 UNIBUS가 실제 GPS 이력과 운행 통계를 축적해야 하는 이유를 뒷받침한다.
- 현재 프로토타입의 경로 거리 기반 ETA가 동일한 수준의 예측기라는 근거로 사용하지 않는다.

**R05. Cathey, F. W., & Dailey, D. J. (2003). A prescription for transit arrival/departure prediction using automatic vehicle location data. _Transportation Research Part C: Emerging Technologies, 11_(3-4), 241-264. https://doi.org/10.1016/S0968-090X(03)00023-8**

- 차량 추적, 상태 필터링, 예측을 분리한 도착·출발 예측 구조를 제시한다.
- UNIBUS의 위치 수집, 최신 상태 저장, 사용자 표시를 계층화하는 설계와 비교할 수 있다.
- 교통상황과 정류장 정차시간이 반영되지 않은 데모 시뮬레이션의 한계를 밝히는 데 사용한다.

**R06. Sun, D., Luo, H., Fu, L., Liu, W., Liao, X., & Zhao, M. (2007). Predicting bus arrival time on the basis of Global Positioning System data. _Transportation Research Record, 2034_(1), 62-72. https://doi.org/10.3141/2034-08**

- 실시간·과거 구간속도, 시간·공간 변동, GIS 지도 정합을 결합한 예측 방법을 제시한다.
- 운행 이력이 없는 프로토타입과 데이터 기반 예측 시스템 사이의 기능 차이를 설명한다.
- 사례 노선에서의 성과를 UNIBUS의 성과 수치로 인용하지 않는다.

**R07. Newson, P., & Krumm, J. (2009). Hidden Markov map matching through noise and sparseness. In _Proceedings of the 17th ACM SIGSPATIAL International Conference on Advances in Geographic Information Systems_ (pp. 336-343). https://doi.org/10.1145/1653771.1653818**

- 잡음이 크거나 드문 GPS 표본을 도로망에 정합하는 은닉 마르코프 모델 기반 방법을 제안한다.
- 실제 운행 단계에서 단순 최근접 좌표보다 견고한 지도 정합이 필요하다는 근거다.
- UNIBUS에 HMM 지도 정합이 구현되었다고 주장하는 근거는 아니다.

**R08. Han, Q., Liu, K., Zeng, L., He, G., Ye, L., & Li, F. (2020). A bus arrival time prediction method based on position calibration and LSTM. _IEEE Access, 8_, 42372-42383. https://doi.org/10.1109/ACCESS.2020.2976574**

- 위치 보정, 이동·정차 요인, 과거·실시간 자료와 LSTM을 결합해 다중 정류장 도착시간을 예측한다.
- 장기적으로 축적된 위치 이력을 활용하는 예측 고도화 방향을 제시한다.
- 학습 데이터가 없는 현 프로토타입에 딥러닝 성능을 귀속하지 않는다.

**R09. Elliott, T., & Lumley, T. (2020). Modelling the travel time of transit vehicles in real-time through a GTFS-based road network using GPS vehicle locations. _Australian & New Zealand Journal of Statistics, 62_(2), 153-167. https://doi.org/10.1111/anzs.12294**

- GTFS 기반 도로망과 GPS 위치를 사용해 대중교통 이동시간을 실시간 모델링한다.
- 정적 노선·시간표와 실시간 위치를 표준화된 식별자로 연결하는 발전 방향을 뒷받침한다.
- 캠퍼스 내부의 비표준 노선에 GTFS를 그대로 적용할 수 있다는 의미는 아니다.

### C. 캠퍼스 및 이동 디지털 트윈

**R10. Hu, P. (2023). Investigation on smart campus management platform based on digital twin. _Procedia Computer Science, 228_, 937-945. https://doi.org/10.1016/j.procs.2023.11.123**

- 캠퍼스 환경·설비·구성원 정보를 디지털화하고 3차원 시각화와 분석을 연결하는 관리 플랫폼 구상을 제시한다.
- UNIBUS 3D 캠퍼스가 장식이 아니라 운행 객체와 공간 정보를 연결하는 인터페이스라는 논거에 활용한다.
- 논문에 보고된 보안 백분율은 측정 정의가 UNIBUS와 다르므로 비교 지표로 사용하지 않는다.

**R11. Liu, Y., Tu, X., Chen, D., Han, K., Altintas, O., Wang, H., & Xie, J. (2023). Visualization of mobility digital twin: Framework design, case study, and future challenges. In _2023 IEEE 20th International Conference on Mobile Ad Hoc and Smart Systems_ (pp. 170-177). https://doi.org/10.1109/MASS58611.2023.00028**

- 차량·보행자와 같은 이동 객체의 디지털 복제, 3D 표현, 물리-디지털 동기성을 포함한 이동 디지털 트윈 프레임워크를 제시한다.
- UNIBUS의 경로 위 버스 애니메이션과 2D/3D 동기화 설계를 평가할 개념적 기준을 제공한다.
- 실제 차량 센서와 연결되지 않은 시뮬레이션을 완전한 운영 디지털 트윈으로 부르지 않도록 경계를 제시한다.

**R12. Chen, K.-C., Chang, Y.-T., & Hsieh, S.-H. (2024). A digital twin platform based on 3D building models and smart IoT for a climate-resilient campus: A case study of National Taiwan University. In _Computing in Civil Engineering 2023_ (pp. 553-561). https://doi.org/10.1061/9780784485231.066**

- 3D 건물 모델, WebGIS, 서버, 데이터베이스를 결합해 정적·동적 캠퍼스 정보를 실시간 갱신하는 구조를 사례로 제시한다.
- UNIBUS의 3D 공간 모델과 서버 상태를 분리하고 연결한 구조를 논의하는 근거다.
- 기후·IoT 센서 중심 사례이므로 교통 운영 효과를 직접 뒷받침하지 않는다.

**R13. Xu, H., Shao, Y., Chen, J., Wang, C. R., & Berres, A. (2024). Semi-automatic geographic information system framework for creating photo-realistic digital twin cities to support autonomous driving research. _Transportation Research Record, 2678_(6), 1068-1084. https://doi.org/10.1177/03611981231205884**

- GIS 자료와 3D 프리팹 모델을 결합한 반자동 실세계 3D 구축 파이프라인을 제안한다.
- 수작업 중심인 현재 캠퍼스 모델의 위치 정확도·유지보수 한계를 설명하고 향후 GIS 기반 제작으로 확장하는 근거다.
- 자율주행 검증용 고정밀 도시와 현 프로토타입의 시각적 추상화 수준은 동일하지 않다.

### D. 대학 셔틀 응용

**R14. Gonzales, A. T., Thamadharan, K., & Jothi, N. (2024). Efficient campus shuttle tracking and management mobile application for college campus. _Proceedings of International Conference on Artificial Life and Robotics, 29_, 482-486. https://doi.org/10.5954/ICAROB.2024.OS18-1**

- 대학 셔틀의 실시간 위치, 예약, 학생·관리자 기능을 모바일 앱으로 통합한 사례를 제시한다.
- 대학 셔틀에서 사용자용 위치 정보와 관리자용 운영 관리가 함께 필요하다는 직접 비교 자료다.
- 해당 사례에는 설문 검증이 포함되지만, UNIBUS는 현장 사용자 평가가 없으므로 만족도 결과를 전이하지 않는다.

### E. 표준, 플랫폼 및 보안 지침

**S01. MobilityData. (n.d.). _GTFS Realtime best practices_. Retrieved July 15, 2026, from https://gtfs.org/documentation/realtime/realtime-best-practices/**

- 차량 위치 피드는 변경 시 또는 최소 30초마다 갱신하고, 차량 위치·운행 갱신 자료는 90초보다 오래되지 않도록 권고한다.
- UNIBUS의 위치 신선도 판정과 향후 운영 목표를 설정하는 기준이다. 현재 구현의 45초 stale 기준은 이 권고보다 엄격하지만 실제 송신주기를 보장한 결과는 아니다.

**S02. World Wide Web Consortium. (2026). _Service Workers Nightly_. https://www.w3.org/TR/service-workers/**

- 서비스 워커의 이벤트 처리, 요청 가로채기, 캐시 저장소를 규정하며 오프라인 웹 애플리케이션의 기술적 기반을 제공한다.
- UNIBUS의 PWA 캐싱 구조를 설명하는 표준 근거다.

**S03. World Wide Web Consortium. (2026). _Web Application Manifest: W3C Working Draft 7 May 2026_. https://www.w3.org/TR/appmanifest/**

- 웹 앱 이름, 아이콘, 시작 URL, 표시 모드 등 설치형 웹 애플리케이션 메타데이터 형식을 정의한다.
- UNIBUS가 별도 네이티브 패키징 없이 설치 가능한 PWA로 구성된 근거를 제공한다. 작업초안임을 명시한다.

**S04. National Institute of Standards and Technology. (2025). _Digital identity guidelines: Authentication and authenticator management (NIST SP 800-63B-4)_. https://doi.org/10.6028/NIST.SP.800-63B-4**

- 비밀번호 차단 목록, 실패 인증 시도 제한, 세션 비밀의 생성·수명·무효화에 대한 요구를 제시한다.
- UNIBUS 인증의 강점과 로그인 rate limiting 부재를 평가하는 기준이다.

**S05. OWASP Foundation. (n.d.). _HTML5 security cheat sheet_. Retrieved July 15, 2026, from https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html**

- 자바스크립트에서 읽을 수 있는 localStorage에 세션 식별자를 저장하지 말고 HttpOnly 쿠키를 고려하라고 권고한다.
- 현재 30일 bearer token 저장 방식의 잔여 위험을 판정하는 직접 근거다.

**S06. PostgreSQL Global Development Group. (2026). _PostgreSQL 17 documentation: Row security policies_. https://www.postgresql.org/docs/17/ddl-rowsecurity.html**

- 행 수준 보안 정책이 조회·삽입·수정·삭제를 역할과 조건별로 제한하며, 정책이 없을 때 기본 거부가 적용됨을 설명한다.
- UNIBUS 데이터베이스 RLS 평가의 기술적 근거다.

**S07. Supabase. (n.d.). _Row level security_. Retrieved July 15, 2026, from https://supabase.com/docs/guides/database/postgres/row-level-security**

- 브라우저에서 노출되는 스키마의 테이블에 RLS를 활성화하고 역할별 최소 권한을 부여할 것을 요구한다.
- anon 키를 사용하는 UNIBUS에서 데이터 계층 방어가 필요한 이유를 설명한다.

**S08. NAVER Cloud Platform. (n.d.). _NAVER 지도 API v3 기술문서_. Retrieved July 15, 2026, from https://navermaps.github.io/maps.js.ncp/docs/**

- 2D 지도에서 Marker와 Polyline을 생성하고 좌표 기반 상호작용을 구현하는 공식 API를 제공한다.
- 사용자 지도와 관리자 경로 편집기의 2D 시각화 구현을 설명할 때 사용한다.

## 3. 검증 상태표

| ID | 자료 유형 | DOI/공식 URL | 메타데이터 확인 | 원문·초록 확인 | 논문 사용 상태 |
|---|---|---|---|---|---|
| R01-R09 | 학술 논문 | DOI 9건 | Crossref | 출판사 초록/메타데이터 | 포함 |
| R10-R13 | 디지털 트윈 연구 | DOI 4건 | Crossref | Elsevier, IEEE/arXiv, NTU, SAGE | 포함 |
| R14 | 학회 논문 | DOI | Crossref | 학회 페이지 및 공개 PDF | 포함 |
| S01-S08 | 공식 표준·문서 | 영구 URL/DOI | 발행기관 | 공식 본문 | 포함 |

DOI 14건은 `doi.org`에서 원 출판사로 연결되는 것을 확인했다. 일부 출판사 페이지는 자동 접근을 제한했으나 Crossref 메타데이터, DOI 리졸버, 공개 초록 또는 기관 저장소 중 둘 이상으로 서지사항을 교차 검증했다. 직접 인용은 사용하지 않고 검증된 초록과 명시된 표준 조항을 패러프레이즈한다.

## 4. 제외 및 해석 주의사항

- 스마트 교실·일반 교육 플랫폼처럼 캠퍼스 교통과 연결이 약한 자료는 제외했다.
- API 제공사의 기능 설명은 구현 근거로만 사용하고 독립적인 성능 증거로 사용하지 않는다.
- 현장 사용자 시험이 없는 UNIBUS에 타 연구의 만족도와 정확도를 전이하지 않는다.
- 현재 ETA는 고정 속도와 경로 진행률에 기반한 시뮬레이션 값이며 GPS 이력, 실시간 교통, 정차시간을 학습한 예측값이 아니다.
- 3D 모델은 실제 센서와 연속 동기화된 운영 디지털 트윈이 아니라 이동 객체·경로·공간 상태를 결합한 프로토타입 수준의 시각화다.
