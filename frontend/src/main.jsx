import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

window.API_BASE_URL = import.meta.env.VITE_API_URL || "https://info-app-backend-7r0e.onrender.com";

import App from './App.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { TimeProvider } from './context/TimeContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <TimeProvider>
        <App />
      </TimeProvider>
    </ThemeProvider>
  </StrictMode>,
)
