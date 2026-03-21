import React from 'react'
import ReactDOM from 'react-dom/client'
import './styles/globals.css'
import App from './app/App.tsx'

// 새 서비스워커가 활성화되면 페이지를 자동 새로고침해서
// 항상 최신 빌드(CSS/JS)를 사용하도록 보장
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    window.location.reload()
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)