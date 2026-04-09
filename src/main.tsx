import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Analytics } from '@vercel/analytics/react'
import './index.css'
import { AppShell } from './components/layout/AppShell'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppShell />
    <Analytics />
  </StrictMode>,
)
