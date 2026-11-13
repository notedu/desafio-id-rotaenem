import type { Page } from '../types/navegacao'
import { Icon } from '../components/Icone'
import { PageHeader } from '../components/CabecalhoPagina'
import { StatCard } from '../components/CartaoEstatistica'
import { TaskCard } from '../components/CartaoTarefa'
import type { Goal, PlanSession, Simulation, StudentPerformance, WeeklyPlan } from '../services/autenticacao'

type Props = {
  studentName: string
  goal: Goal | null
  simulations: Simulation[]
  performance: StudentPerformance | null
  weeklyPlan: WeeklyPlan | null
  loading: boolean
  error: string
  onNewSimulado: () => void
  onNavigate: (page: Page) => void
}

const areaColors: Record<string, string> = {
  MT: '#4568dc', CN: '#18a886', CH: '#e69b35', LC: '#8b63cf', RED: '#e26d73',
}

const areaClasses: Record<string, string> = {
  MT: 'blue', CN: 'green', CH: 'orange', LC: 'purple', RED: 'coral',
}

function scoreLabel(value: number | null | undefined): string {
  return value == null ? '—' : Math.round(value).toLocaleString('pt-BR')
}

function simulationAverage(simulation: Simulation | undefined): number | null {
  if (!simulation) return null
  const scores = Object.values(simulation.notas).filter((score) => Number.isFinite(score))
  return scores.length ? scores.reduce((sum, score) => sum + score, 0) / scores.length : null
}

function durationLabel(hours: number): string {
  const minutes = Math.round(hours * 60)
  const wholeHours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  if (!wholeHours) return `${remainingMinutes} min`
  return remainingMinutes ? `${wholeHours}h ${remainingMinutes}min` : `${wholeHours}h`
}

function sessionDateLabel(session: PlanSession): string {
  return new Date(`${session.data}T00:00:00`).toLocaleDateString('pt-BR', {
    weekday: 'short', day: '2-digit', month: 'short',
  }).replaceAll('.', '').toUpperCase()
}

function sessionTimeLabel(session: PlanSession): string {
  const start = session.horario_inicio.slice(0, 5)
  const endDate = new Date(`2000-01-01T${start}:00`)
  endDate.setMinutes(endDate.getMinutes() + Math.round(session.horas * 60))
  const end = endDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  return `${start} — ${end}`
}

export function HomePage({ studentName, goal, simulations, performance, weeklyPlan, loading, error, onNewSimulado, onNavigate }: Props) {
  const firstName = studentName.trim().split(/\s+/)[0] || 'estudante'
  const currentAverage = performance?.simulado_atual?.nota_media ?? null
  const targetScore = goal?.nota_corte ?? null
  const previousAverage = simulationAverage(simulations[1])
  const scoreChange = currentAverage !== null && previousAverage !== null
    ? Math.round(currentAverage - previousAverage)
    : null
  const progress = currentAverage !== null && targetScore !== null && targetScore > 0
    ? Math.min(100, Math.max(0, Math.round((currentAverage / targetScore) * 100)))
    : null
  const priority = performance?.ranking_prioridades[0]
  const chartAreas = performance?.areas ?? []
  const upcomingSessions = [...(weeklyPlan?.sessoes ?? [])]
    .sort((left, right) => `${left.data}T${left.horario_inicio}`.localeCompare(`${right.data}T${right.horario_inicio}`))
    .slice(0, 3)
  const today = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long',
  }).toUpperCase()

  return <>
    <PageHeader eyebrow={today} title={<>Olá, {firstName} <span className="wave">✳</span></>} description="Acompanhe sua meta, suas notas e os próximos estudos." action={<button className="button-primary" onClick={onNewSimulado}><Icon name="plus" size={17} /> Registrar simulado</button>} />

    {error && <p className="data-error" role="alert">{error}</p>}

    <section className="hero-card">
      <div className="hero-content">
        <div className="hero-kicker"><Icon name="target" size={16} /> SUA JORNADA</div>
        <h2>{goal ? <>Seu objetivo é:<br /><span>{goal.curso}</span></> : 'Defina sua meta de estudos'}</h2>
        <p>{goal ? 'Seu curso desejado e suas notas-alvo estão salvos no seu perfil.' : 'Cadastre um curso e suas notas-alvo para acompanhar seu progresso.'}</p>
        <button className="hero-link" onClick={() => onNavigate('meta')}>{goal ? 'Ver minha meta' : 'Cadastrar meta'} <Icon name="arrow" size={17} /></button>
      </div>
      <div className="hero-progress">
        <div className="progress-ring" style={{ background: `conic-gradient(#c5e5d9 0deg ${(progress ?? 0) * 3.6}deg, #ffffff2e ${(progress ?? 0) * 3.6}deg 360deg)` }}>
          <div className="progress-ring-inner"><strong>{progress === null ? '—' : progress}<span>{progress === null ? '' : '%'}</span></strong><small>da nota de corte</small></div>
        </div>
        <div className="hero-progress-caption"><strong>{currentAverage === null ? 'Registre um simulado' : `${scoreLabel(currentAverage)} pontos no último simulado`}</strong><span>{targetScore === null ? 'Cadastre uma nota de referência' : `Nota de referência: ${scoreLabel(targetScore)} pontos`}</span></div>
      </div>
      <div className="hero-orb orb-one" /><div className="hero-orb orb-two" />
    </section>

    <section className="stats-row">
      <StatCard icon="chart" label="MÉDIA DO ÚLTIMO SIMULADO" value={scoreLabel(currentAverage)} suffix={currentAverage === null ? '' : 'pts'} detail={scoreChange === null ? (performance?.simulado_atual ? 'Resultado mais recente' : 'Nenhum simulado registrado') : `${scoreChange >= 0 ? '+' : ''}${scoreChange} pts desde o anterior`} positive={scoreChange !== null && scoreChange > 0} />
      <StatCard icon="target" label="NOTA DE REFERÊNCIA" value={scoreLabel(targetScore)} suffix={targetScore === null ? '' : 'pts'} detail={goal?.curso ?? 'Cadastre uma meta para comparar'} />
      <StatCard icon="clock" label="PLANEJADO NESTA SEMANA" value={weeklyPlan ? weeklyPlan.horas_semanais.toLocaleString('pt-BR', { maximumFractionDigits: 1 }) : '—'} suffix={weeklyPlan ? 'h' : ''} detail={weeklyPlan ? `${weeklyPlan.sessoes.length} ${weeklyPlan.sessoes.length === 1 ? 'sessão' : 'sessões'} no plano` : 'Gere seu plano semanal'} />
    </section>

    <section className="content-grid">
      <div className="panel performance-panel">
        <div className="panel-heading"><div><span className="eyebrow">VISÃO GERAL</span><h2>Notas por área</h2></div><button className="select-button" onClick={() => onNavigate('desempenho')}>Ver desempenho <Icon name="arrow" size={15} /></button></div>
        {loading && <p className="data-message">Carregando seu desempenho...</p>}
        {!loading && chartAreas.length > 0 && <div className="performance-chart">
          <div className="chart-y-labels"><span>1000</span><span>800</span><span>600</span><span>400</span><span>200</span><span>0</span></div>
          <div className="chart-main"><div className="chart-grid-lines"><i /><i /><i /><i /><i /><i /></div>
            <div className="chart-bars">{chartAreas.map((area) => <div className="bar-group" key={area.sigla}>
              <div className="bar-pair"><div className="bar goal-bar" title={`Nota-alvo: ${scoreLabel(area.nota_alvo)}`} style={{ height: `${Math.max(0, Math.min(100, (area.nota_alvo ?? 0) / 10))}%` }} /><div className="bar score-bar" title={`Nota atual: ${scoreLabel(area.nota_atual)}`} style={{ height: `${Math.max(0, Math.min(100, (area.nota_atual ?? 0) / 10))}%`, background: areaColors[area.sigla] ?? '#18856d' }} /></div>
              <span>{area.sigla}</span>
            </div>)}</div>
            <div className="chart-legend"><span><i className="legend-score" />Nota atual</span><span><i className="legend-goal" />Nota-alvo</span></div>
          </div>
        </div>}
        {!loading && chartAreas.length === 0 && <p className="empty-history">Cadastre uma meta e registre um simulado para ver suas notas por área.</p>}
      </div>

      <div className="panel priority-panel">
        <div className="panel-heading"><div><span className="eyebrow">FOCO SUGERIDO</span><h2>Prioridade de estudo</h2></div>{priority && <span className="priority-badge">MAIOR PRIORIDADE</span>}</div>
        {priority ? <>
          <div className="priority-feature"><span className="priority-icon">∑</span><div><strong>{priority.nome}</strong><span>Ganho necessário: {scoreLabel(priority.ganho_necessario)} pontos</span></div><span className="priority-number">01</span></div>
          <div className="priority-reason"><Icon name="spark" size={17} /> Prioridade calculada com suas notas e os pesos da meta.</div>
        </> : <p className="empty-history">Registre uma meta e um simulado para calcular suas prioridades.</p>}
        <button className="text-link" onClick={() => onNavigate(priority ? 'desempenho' : 'meta')}>{priority ? 'Ver meu desempenho' : 'Configurar minha meta'} <Icon name="arrow" size={16} /></button>
      </div>
    </section>

    <section className="panel week-panel">
      <div className="panel-heading"><div><span className="eyebrow">{weeklyPlan ? `SEMANA ${new Date(`${weeklyPlan.semana_inicio}T00:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replaceAll('.', '').toUpperCase()} — ${new Date(`${weeklyPlan.semana_fim}T00:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replaceAll('.', '').toUpperCase()}` : 'SEU PLANO'}</span><h2>Próximas sessões</h2></div><button className="text-link" onClick={() => onNavigate('plano')}>Ver plano completo <Icon name="arrow" size={16} /></button></div>
      {loading && <p className="data-message">Carregando seu plano...</p>}
      {!loading && upcomingSessions.length > 0 && <div className="week-tasks">{upcomingSessions.map((session) => <TaskCard
        key={session.id}
        day={sessionDateLabel(session)}
        subject={session.area_nome}
        topic={session.conteudo?.titulo ?? session.topico_nome ?? 'Revisão geral'}
        time={`${sessionTimeLabel(session)} · ${durationLabel(session.horas)}`}
        color={areaClasses[session.area_sigla] ?? 'blue'}
        href={session.conteudo?.url ?? undefined}
      />)}</div>}
      {!loading && upcomingSessions.length === 0 && <p className="empty-history">Você ainda não tem sessões planejadas para esta semana.</p>}
    </section>

    <footer className="page-footer"><span>Dados atualizados a partir do seu perfil e plano de estudos.</span><span>RotaENEM <b>·</b> {new Date().getFullYear()}</span></footer>
  </>
}
