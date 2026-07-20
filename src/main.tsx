import React from 'react'
import ReactDOM from 'react-dom/client'
import './styles/globals.css'
import App from './app/App.tsx'

const PRELOAD_RELOAD_KEY = 'unibus:preload-reload-at'
const PRELOAD_RELOAD_GUARD_MS = 30_000
let reloadRequested = false

// 배포가 바뀐 직후 오래된 lazy chunk를 요청하면 새 빌드로 한 번만 갱신한다.
window.addEventListener('vite:preloadError', (event) => {
  let lastReloadAt = 0

  try {
    lastReloadAt = Number(sessionStorage.getItem(PRELOAD_RELOAD_KEY) ?? 0)
  } catch {
    // 저장소를 사용할 수 없으면 현재 문서에서만 중복 갱신을 막는다.
  }

  if (
    reloadRequested ||
    !navigator.onLine ||
    Date.now() - lastReloadAt < PRELOAD_RELOAD_GUARD_MS
  ) {
    return
  }

  event.preventDefault()
  reloadRequested = true

  try {
    sessionStorage.setItem(PRELOAD_RELOAD_KEY, String(Date.now()))
  } catch {
    // 새로고침은 계속 진행하고, 라우트 오류 화면이 반복 실패를 처리한다.
  }

  window.location.reload()
})

// 이미 서비스 워커가 있던 탭만 업데이트 때 갱신한다.
// 첫 방문은 새 워커가 clientsClaim을 호출해도 불필요하게 두 번 로드하지 않는다.
if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloadRequested) return
    reloadRequested = true
    window.location.reload()
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
