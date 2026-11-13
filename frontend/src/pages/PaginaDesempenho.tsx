import { areas } from '../data/dadosEstudo'
import { Icon } from '../components/Icone'
import { PageHeader } from '../components/CabecalhoPagina'
import { StatCard } from '../components/CartaoEstatistica'
import type { Goal, Simulation, StudentPerformance } from '../services/autenticacao'

type Props = {
  goal: Goal | null
  simulations: Simulation[]
  performance: StudentPerformance | null
  loading: boolean
  error: string
  onNewSimulado: () => void
}

function dateLabel(value: string): string {
  return new Date(`${value}T00:00:00`).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric',
  }).replaceAll('.', '').toUpperCase()
}

function scoreLabel(value: number | null | undefined): string {
  return value == null ? '—' : String(Math.round(value))
}

export function PerformancePage({ goal, simulations, performance, loading, error, onNewSimulado }: Props) {
  const latestSimulation = performance?.simulado_atual
  const reference = performance?.referencia
  const areasByCode = new Map(areas.map((area) => [area.sigla, area]))
  const topPriority = performance?.ranking_prioridades[0]

  return <>
    <PageHeader eyebrow="SUA EVOLUÇÃO EM FOCO" title="Meu desempenho" description="Compare seu último simulado com sua meta e com as médias do ENEM." action={<button className="button-primary" onClick={onNewSimulado}><Icon name="plus" size={17} /> Registrar simulado</button>} />
    {loading && <p className="data-message">Atualizando seus dados de desempenho...</p>}
    {error && <p className="data-error" role="alert">{error}</p>}
    <div className="stats-row">
      <StatCard icon="chart" label="MÉDIA DO ÚLTIMO SIMULADO" value={scoreLabel(latestSimulation?.nota_media)} suffix={latestSimulation?.nota_media == null ? '' : 'pts'} detail={latestSimulation ? `Realizado em ${dateLabel(latestSimulation.realizado_em)}` : 'Nenhum simulado registrado'} />
      <StatCard icon="target" label="NOTA DE REFERÊNCIA" value={goal?.nota_corte == null ? '—' : String(goal.nota_corte)} suffix={goal?.nota_corte == null ? '' : 'pts'} detail={goal?.curso ?? 'Cadastre uma meta para comparar'} />
      <StatCard icon="spark" label="SIMULADOS REALIZADOS" value={String(simulations.length)} suffix="" detail={simulations[0] ? `Último em ${dateLabel(simulations[0].realizado_em)}` : 'Comece registrando um simulado'} />
    </div>

    <section className="panel full-performance">
      <div className="panel-heading"><div><span className="eyebrow">ACOMPANHAMENTO POR ÁREA</span><h2>Notas atuais, metas e ENEM</h2></div><span className="chart-period">{latestSimulation ? dateLabel(latestSimulation.realizado_em) : 'SEM SIMULADO'}</span></div>
      <div className="performance-area-list">
        <div className="performance-area-row performance-area-header"><span>ÁREA</span><span>NOTA ATUAL</span><span>SUA META</span><span>MÉDIA ENEM</span><span>DIF. META</span></div>
        {(performance?.areas ?? []).map((area, index) => {
          const visualArea = areasByCode.get(area.sigla)
          const difference = area.ganho_necessario
          return <div className="performance-area-row" key={area.sigla}>
            <span className="performance-subject"><i className="area-color" style={{ background: visualArea?.color ?? '#9aa5a1' }} /><strong>{area.nome}</strong><small>0{index + 1}</small></span>
            <strong>{scoreLabel(area.nota_atual)}</strong>
            <span>{scoreLabel(area.nota_alvo)}</span>
            <span>{scoreLabel(area.media_referencia)}</span>
            <span className={`area-difference ${difference !== null && difference !== undefined && difference <= 20 ? 'close' : ''}`}>{difference == null ? '—' : `${Math.round(difference)} pts`}</span>
          </div>
        })}
        {!loading && performance?.areas.length === 0 && <p className="empty-history">As áreas de conhecimento ainda não estão configuradas na API.</p>}
      </div>
      <div className="performance-note"><Icon name="spark" size={17} /><span>{reference?.disponivel
        ? `Médias do ENEM ${reference.ano} na abrangência ${reference.abrangencia === 'estadual' ? `estadual (${reference.uf})` : 'nacional'}, calculadas com ${reference.participantes?.toLocaleString('pt-BR') ?? '—'} participantes.`
        : reference?.mensagem ?? 'A média de referência do ENEM não está disponível.'}</span></div>
    </section>

    <section className="panel priority-ranking">
      <div className="panel-heading"><div><span className="eyebrow">FOCO SUGERIDO</span><h2>Prioridades de estudo</h2></div><span className="history-caption">Meta ponderada por área</span></div>
      {topPriority && <p className="priority-intro">Comece por <strong>{topPriority.nome}</strong>: é a área com maior prioridade considerando o ganho necessário e o peso definido na sua meta.</p>}
      {performance?.ranking_prioridades.length
        ? <div className="priority-list">{performance.ranking_prioridades.map((item, index) => {
          const visualArea = areasByCode.get(item.sigla)
          const maximum = performance.ranking_prioridades[0]?.prioridade ?? 0
          const width = maximum > 0 ? Math.max(4, (item.prioridade / maximum) * 100) : 0
          return <div className="priority-row" key={item.sigla}>
            <span className="priority-position">0{index + 1}</span>
            <span className="area-color" style={{ background: visualArea?.color ?? '#9aa5a1' }} />
            <strong>{item.nome}</strong>
            <div className="priority-track"><i style={{ width: `${width}%`, background: visualArea?.color ?? '#18856d' }} /></div>
            <span className="priority-gap">faltam {Math.round(item.ganho_necessario)} pts</span>
            <strong className="priority-score">{item.prioridade.toLocaleString('pt-BR')}</strong>
          </div>
        })}</div>
        : <p className="empty-history">Cadastre uma meta e registre um simulado para gerar suas prioridades por área.</p>}
    </section>

    <section className="panel simulado-history"><div className="panel-heading"><div><span className="eyebrow">HISTÓRICO</span><h2>Simulados recentes</h2></div><span className="history-caption">{loading ? 'Carregando...' : `${simulations.length} registro${simulations.length === 1 ? '' : 's'}`}</span></div>
      {simulations.length === 0 && !loading
        ? <p className="empty-history">Seus simulados salvos aparecerão aqui.</p>
        : simulations.slice(0, 3).map((simulation) => {
          const scores = Object.values(simulation.notas)
          const score = scores.length ? scores.reduce((total, value) => total + value, 0) / scores.length : null
          return <div className="history-row" key={simulation.id}>
            <span className="history-date">{dateLabel(simulation.realizado_em)}</span>
            <strong>{simulation.descricao || `Simulado ${simulation.id}`}</strong>
            <span>{score === null ? '—' : `${Math.round(score)} pontos`}</span>
          </div>
        })}
    </section>
  </>
}
