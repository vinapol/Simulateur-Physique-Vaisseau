import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ShipConfigurationProvider } from './store/ShipConfigurationProvider'
import { LanguageProvider } from './i18n/LanguageContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <ShipConfigurationProvider>
        <App />
      </ShipConfigurationProvider>
    </LanguageProvider>
  </StrictMode>,
)
