import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthenticationProvider } from './context/AuthenticationContext'
import Authentication from './components/authentication'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthenticationProvider>
      <Authentication />
    </AuthenticationProvider>
  </StrictMode>
)
