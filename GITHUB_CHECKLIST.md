# ✅ GitHub 업로드 전 체크리스트

## 🔐 **보안 확인 (필수!)**

### **1. 민감한 파일 확인**

```bash
# 커밋될 파일 목록 확인
git status

# ⚠️ 다음 파일들이 목록에 나타나면 안 됩니다:
# - utils/supabase/info.tsx
# - .env
# - .env.local
# - api-keys.json
# - secrets.json
```

### **2. .gitignore 작동 확인**

```bash
# utils/supabase/info.tsx가 무시되는지 확인
git check-ignore utils/supabase/info.tsx
# 출력: utils/supabase/info.tsx ✅

# .env 파일이 무시되는지 확인
git check-ignore .env
# 출력: .env ✅

# 무시되지 않으면 .gitignore에 추가 필요!
```

### **3. 이미 커밋된 민감한 파일 확인**

```bash
# Git 히스토리에서 민감한 파일 검색
git log --all --full-history -- utils/supabase/info.tsx

# 결과가 있으면 위험! 히스토리에서 제거 필요
# 제거 방법:
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch utils/supabase/info.tsx" \
  --prune-empty --tag-name-filter cat -- --all
```

### **4. 하드코딩된 API 키 검색**

```bash
# 코드에서 API 키 패턴 검색
grep -r "supabase\.co" src/
grep -r "SUPABASE" src/
grep -r "eyJ" src/  # JWT 토큰 패턴

# 결과가 나오면 환경 변수로 변경 필요!
```

---

## 📋 **파일 체크리스트**

### **✅ 있어야 하는 파일**

- [x] `.gitignore` - Git 무시 파일 목록
- [x] `.env.example` - 환경 변수 예시
- [x] `README.md` - 프로젝트 설명
- [x] `package.json` - 의존성 목록
- [x] `SQL_MIGRATION_SCRIPT.sql` - DB 스키마

### **❌ 없어야 하는 파일**

- [ ] `utils/supabase/info.tsx` - **절대 커밋 금지!**
- [ ] `.env` - 환경 변수 실제 값
- [ ] `.env.local` - 로컬 환경 변수
- [ ] `node_modules/` - 의존성 폴더
- [ ] `dist/` - 빌드 결과물
- [ ] `*.log` - 로그 파일
- [ ] `.DS_Store` - macOS 시스템 파일

---

## 🧪 **테스트**

### **1. 빌드 테스트**

```bash
# 프로덕션 빌드 성공 확인
npm run build

# 오류 없이 빌드되어야 함 ✅
```

### **2. 타입 체크**

```bash
# TypeScript 타입 오류 확인
npx tsc --noEmit

# 오류 없어야 함 ✅
```

### **3. Linting (선택)**

```bash
# ESLint 검사 (설정된 경우)
npm run lint
```

---

## 📝 **Git 커밋 가이드**

### **1. 초기 커밋**

```bash
# Git 초기화 (아직 안 했다면)
git init

# .gitignore 먼저 추가
git add .gitignore
git commit -m "chore: add .gitignore"

# 나머지 파일 추가
git add .
git commit -m "feat: initial commit - SCH Shuttle App"
```

### **2. GitHub 레포지토리 생성**

1. GitHub에서 **New Repository** 클릭
2. Repository name: `sch-shuttle-app`
3. **Private** 선택 (공개 전까지)
4. **DO NOT** initialize with README (이미 있음)
5. Create repository

### **3. 원격 저장소 연결**

```bash
# 원격 저장소 추가
git remote add origin https://github.com/YOUR_USERNAME/sch-shuttle-app.git

# 메인 브랜치로 변경 (main 권장)
git branch -M main

# 푸시
git push -u origin main
```

---

## 🚨 **긴급 상황: API 키가 노출되었다면?**

### **즉시 조치**

1. **Supabase Dashboard**
   - Project Settings → API
   - **Reset** 버튼 클릭 (새 키 발급)

2. **카카오 개발자**
   - 내 애플리케이션 → 앱 키
   - **재발급**

3. **네이버 클라우드**
   - Application → Client Secret
   - **재발급**

4. **GitHub 레포지토리**
   - Settings → Danger Zone
   - **Delete this repository** (또는 Private으로 변경)

5. **Git 히스토리 정리**
   ```bash
   # 민감한 파일 히스토리에서 완전 제거
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch PATH/TO/FILE" \
     --prune-empty --tag-name-filter cat -- --all
   
   # 강제 푸시 (주의!)
   git push origin --force --all
   ```

---

## ✅ **최종 체크리스트**

업로드 전 모든 항목을 확인하세요:

- [ ] `.gitignore` 파일 존재
- [ ] `utils/supabase/info.tsx` 파일이 **커밋 목록에 없음**
- [ ] `.env` 파일이 **커밋 목록에 없음**
- [ ] `git status`에서 민감한 파일 없음
- [ ] `git check-ignore`로 무시 확인
- [ ] 코드에 하드코딩된 API 키 없음
- [ ] `npm run build` 성공
- [ ] `README.md` 작성 완료
- [ ] `.env.example` 작성 완료

---

## 📚 **추가 보안 팁**

### **GitHub Secrets 사용** (CI/CD)

GitHub Actions에서 환경 변수 사용 시:

1. Repository → Settings → Secrets and variables → Actions
2. **New repository secret** 클릭
3. 환경 변수 추가:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `NAVER_MAP_CLIENT_ID`
   - `KAKAO_APP_KEY`

### **Vercel/Netlify 배포 시**

환경 변수를 배포 플랫폼에 직접 설정:

- Vercel: Settings → Environment Variables
- Netlify: Site settings → Build & deploy → Environment

---

## 🎉 **모든 확인 완료!**

위 체크리스트를 모두 통과했다면 안전하게 GitHub에 업로드할 수 있습니다!

```bash
git push -u origin main
```

---

**마지막 업데이트**: 2026년 3월 15일
