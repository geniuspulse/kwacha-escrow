import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'

function renderApp(App) {
  ReactDOM.createRoot(document.getElementById('root')).render(
    React.createElement(App)
  )
}

// Use dynamic import to catch module errors
import('./App')
  .then(mod => renderApp(mod.default))
  .catch(err => {
    document.getElementById('root').innerHTML = 
      '<div style="color:red;padding:2rem;font-family:monospace;background:#111;min-height:100vh">' +
      '<h1>CAUGHT MODULE ERROR</h1>' +
      '<pre style="white-space:pre-wrap;word-break:break-all">' + 
      (err && err.stack ? err.stack : String(err)) +
      '</pre></div>'
  })
