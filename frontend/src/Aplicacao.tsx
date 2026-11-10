import { useState, type FormEvent } from 'react'
import './estilos-aplicacao.css'
import { AppShell } from './componentes/EstruturaAplicacao'
import { SimuladoModal } from './componentes/ModalSimulado'
import { Toast } from './componentes/Notificacao'
import { navItems } from './dados/dadosEstudo'
import { GoalPage } from './paginas/PaginaMeta'
import { HomePage } from './paginas/PaginaInicial'
import { PerformancePage } from './paginas/PaginaDesempenho'
import { StudyPage } from './paginas/PaginaPlanoEstudos'
import type { Page } from './tipos/navegacao'

function App() {
  const [page, setPage] = useState<Page>('inicio')
  const [showSimulado, setShowSimulado] = useState(false)
  const [notice, setNotice] = useState('')
  const [studyDays, setStudyDays] = useState<string[]>(['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'])
  const title = navItems.find((item) => item.id === page)?.label ?? 'Início'

  function notify(message: string) {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 4000)
  }

  function saveSimulado(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setShowSimulado(false)
    notify('Simulado registrado. Suas prioridades serão atualizadas quando os dados forem conectados.')
  }

  return <>
    <AppShell page={page} title={title} onNavigate={setPage} onNotify={() => notify('Você está em dia com seu plano de estudos.')}>
      {page === 'inicio' && <HomePage onNewSimulado={() => setShowSimulado(true)} onNavigate={setPage} />}
      {page === 'desempenho' && <PerformancePage onNewSimulado={() => setShowSimulado(true)} />}
      {page === 'plano' && <StudyPage studyDays={studyDays} setStudyDays={setStudyDays} />}
      {page === 'meta' && <GoalPage onSave={() => notify('Sua meta foi salva.')} />}
    </AppShell>
    <Toast message={notice} />
    {showSimulado && <SimuladoModal onClose={() => setShowSimulado(false)} onSubmit={saveSimulado} />}
  </>
}

export default App
