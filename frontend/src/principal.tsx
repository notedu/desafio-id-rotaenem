import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './estilos-globais.css'
import Aplicacao from './Aplicacao.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Aplicacao />
  </StrictMode>,
)
