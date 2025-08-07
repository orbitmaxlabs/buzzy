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

// Robust splash removal controlled by app readiness
function removeSplash() {
  const splash = document.getElementById('splash');
  if (splash && splash.parentNode) {
    splash.parentNode.removeChild(splash);
  }
}
// Expose a controlled remover so the React app can dismiss the splash when ready
// Keep a long safety timeout to avoid permanent stuck screens in extreme cases
window.__removeSplash = removeSplash;
setTimeout(() => {
  try { removeSplash(); } catch (_) {}
}, 10000);