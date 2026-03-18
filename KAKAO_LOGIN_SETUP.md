# 카카오 로그인 설정 가이드

카카오 로그인이 이제 완전히 작동합니다! 하지만 카카오 개발자 계정 설정이 필요합니다.

## 🚀 빠른 시작

### 1단계: 카카오 개발자 계정 생성 및 앱 등록

1. **카카오 개발자 사이트 접속**
   - https://developers.kakao.com/ 방문
   - 카카오 계정으로 로그인

2. **애플리케이션 추가하기**
   - 우측 상단 "내 애플리케이션" 클릭
   - "애플리케이션 추가하기" 클릭
   - 앱 이름: `SCH Shuttle` (원하는 이름으로 변경 가능)
   - 사업자명: 학교 이름 또는 개인 이름
   - 앱 등록 완료

### 2단계: JavaScript 키 복사

1. 생성된 앱 클릭
2. "앱 키" 섹션에서 **JavaScript 키** 복사
   - 예: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`

### 3단계: 플랫폼 설정

1. 좌측 메뉴에서 "플랫폼" 클릭
2. "Web 플랫폼 등록" 클릭
3. 사이트 도메인 등록:
   ```
   http://localhost:5173
   ```
   - 실제 배포 시에는 배포 도메인도 추가 (예: `https://sch-shuttle.com`)

### 4단계: 카카오 로그인 활성화

1. 좌측 메뉴에서 "카카오 로그인" 클릭
2. "카카오 로그인 활성화" ON으로 설정
3. Redirect URI 설정:
   ```
   http://localhost:5173
   ```

### 5단계: 동의항목 설정

1. 좌측 메뉘에서 "동의항목" 클릭
2. 필수 동의 항목:
   - **프로필 정보(닉네임/프로필 사진)**: 선택 동의
   - **카카오계정(이메일)**: 선택 동의 (이메일 수집 시 필수로 변경 가능)

### 6단계: 코드에 JavaScript 키 적용

다음 파일을 수정하세요:

**`/src/app/services/kakao.ts`**

```typescript
export class KakaoLoginService {
  // ...
  private readonly APP_KEY = 'YOUR_KAKAO_JAVASCRIPT_KEY'; // 여기에 복사한 JavaScript 키 붙여넣기
  // ...
}
```

또는 브라우저 콘솔에서 런타임에 설정:

```javascript
import { kakaoService } from '/src/app/services/kakao';
kakaoService.setAppKey('a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6');
```

## 🎯 테스트 방법

1. 앱 실행 (`npm run dev`)
2. 로그인 페이지 접속
3. "Kakao" 버튼 클릭
4. 카카오 로그인 팝업에서 로그인
5. 동의 화면에서 필요한 권한 동의
6. 자동으로 홈 화면으로 리디렉션

## 🔍 작동 원리

1. **사용자가 "Kakao" 버튼 클릭**
   - 카카오 SDK 로드 및 초기화
   - 카카오 로그인 팝업 표시

2. **사용자가 카카오 계정으로 로그인**
   - 카카오에서 사용자 정보 반환 (kakaoId, 이메일, 닉네임, 프로필 사진)

3. **백엔드로 정보 전송**
   - `/auth/kakao` 엔드포인트로 사용자 정보 전송
   - 기존 사용자인 경우: 로그인
   - 신규 사용자인 경우: 자동 회원가입 후 로그인

4. **JWT 토큰 발급 및 저장**
   - 서버에서 인증 토큰 발급
   - localStorage에 토큰 저장
   - 홈 화면으로 리디렉션

## 🔐 보안 참고사항

- JavaScript 키는 클라이언트에서 사용되므로 노출되어도 상대적으로 안전합니다
- 중요한 작업은 서버에서 처리됩니다
- Admin Key나 REST API 키는 절대 프론트엔드에 노출하지 마세요

## 📝 추가 설정 (선택사항)

### 비즈니스 채널 연결
- 카카오톡 채널과 연동하여 알림 전송 가능
- "비즈니스" > "카카오톡 채널" 메뉴에서 설정

### 로그아웃 구현
이미 구현되어 있습니다:

```javascript
import { kakaoService } from '/src/app/services/kakao';
kakaoService.logout();
```

## ❓ 문제 해결

### "Kakao SDK not loaded" 오류
- 인터넷 연결 확인
- 브라우저 콘솔에서 네트워크 탭 확인

### "Invalid app key" 오류
- JavaScript 키를 정확히 복사했는지 확인
- 앱 키 섹션에서 REST API 키가 아닌 **JavaScript 키**를 사용했는지 확인

### "Invalid redirect URI" 오류
- 카카오 개발자 콘솔에서 Redirect URI가 정확히 등록되었는지 확인
- `http://localhost:5173` (포트 번호 포함)

### 팝업이 차단되는 경우
- 브라우저 팝업 차단 해제
- 설정 > 사이트 설정 > 팝업 및 리디렉션 허용

## 🎉 완료!

이제 카카오 로그인이 완전히 작동합니다. 사용자는 클릭 한 번으로 간편하게 로그인할 수 있습니다!
