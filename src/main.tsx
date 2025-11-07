import { StrictMode } from 'react'
// import { Analytics } from '@vercel/analytics/next'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { inject } from '@vercel/analytics'

inject()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    {/* <Analytics /> */}
  </StrictMode>
)
