import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="app">
      <header className="app-header">
        <h1>🐝 Buzzy</h1>
        <p>Your go-to app for the latest buzz and updates</p>
      </header>
      
      <main className="app-main">
        <div className="card">
          <h2>Welcome to Buzzy!</h2>
          <p>This is a Progressive Web App built with React + Vite</p>
          
          <div className="feature-demo">
            <button onClick={() => setCount((count) => count + 1)}>
              Click count: {count}
            </button>
            <p>Try installing this app on your device!</p>
          </div>
        </div>
        
        <div className="pwa-info">
          <h3>PWA Features:</h3>
          <ul>
            <li>✅ Installable on all devices</li>
            <li>✅ Works offline</li>
            <li>✅ Fast loading</li>
            <li>✅ Native app experience</li>
          </ul>
        </div>
      </main>
    </div>
  )
}

export default App
