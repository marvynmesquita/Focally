import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Optional: listen for messages from the service worker (vite-plugin-pwa)
if (navigator.serviceWorker) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (!event.data) return
    // plugin sends {type: 'SW_UPDATED'} on update when using workbox or its runtime
    console.log('SW message:', event.data)
  })
}

// During development, unregister any previously registered service workers
// to avoid the SW intercepting module requests and returning index.html
if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((regs) => {
    regs.forEach((r) => {
      r.unregister().then((success) => {
        if (success) console.log('Unregistered service worker in dev:', r.scope)
      })
    })
  })
}

