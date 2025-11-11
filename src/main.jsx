import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)


// Service worker messages (useful for update notifications)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (!event.data) return
    console.log('SW message:', event.data)
  })
}

// In development, unregister existing service workers to avoid SW intercepting Vite dev module requests
if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((regs) =>
    regs.forEach((r) => r.unregister().then(() => console.log('Unregistered SW in dev:', r.scope)))
  )
}

