import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './contexts/AuthContext.jsx'
import { NotificationProvider } from './contexts/NotificationContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <NotificationProvider>
        <App />
      </NotificationProvider>
    </AuthProvider>
  </StrictMode>
);

// Robust splash removal: handle load, DOM ready, and post-render fallbacks
function removeSplash() {
  const splash = document.getElementById('splash');
  if (splash && splash.parentNode) {
    splash.parentNode.removeChild(splash);
  }
}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
  // DOM is ready; remove quickly after a short tick to allow first paint
  setTimeout(removeSplash, 100);
} else {
  window.addEventListener('DOMContentLoaded', () => setTimeout(removeSplash, 100));
  window.addEventListener('load', () => setTimeout(removeSplash, 100));
}

// Extra safety: remove after mount regardless (covers PWA resume/edge cases)
requestAnimationFrame(() => requestAnimationFrame(removeSplash));
setTimeout(removeSplash, 2000);