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

// Remove splash once app is mounted and first paint is likely done
window.addEventListener('load', () => {
  const splash = document.getElementById('splash');
  if (splash) {
    // small delay to avoid flash
    setTimeout(() => splash.remove(), 150);
  }
});