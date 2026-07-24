import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

console.log(
  `%c Buku Penghubung Digital \n%c Pembuat: As'adi \n%c Untuk Proyek Amal Milik: Uzmilatul Khorioh `,
  'background: #2d6a4f; color: #ffffff; font-size: 14px; font-weight: bold; padding: 4px 8px; border-radius: 4px;',
  'color: #2d6a4f; font-size: 12px; font-weight: bold; padding-top: 6px;',
  'color: #6c757d; font-size: 11px; font-style: italic;'
);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
