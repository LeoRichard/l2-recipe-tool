import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import './index.css'
import { AppShell } from './components/layout/AppShell'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppShell />
    <Analytics />
    <SpeedInsights />
  </StrictMode>,
)
