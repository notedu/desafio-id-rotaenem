import { useEffect, useState, type FormEvent } from 'react'
import { areas } from '../data/dadosEstudo'
import { Icon } from '../components/Icone'
import { PageHeader } from '../components/CabecalhoPagina'
import type { WeeklyPlan, WeeklyPlanPayload, WeekdayCode } from '../services/autenticacao'

const days: { code: WeekdayCode; label: string }[] = [
  { code: 'SEG', label: 'Segunda' },
  { code: 'TER', label: 'Terça' },
  { code: 'QUA', label: 'Quarta' },
  { code: 'QUI', label: 'Quinta' },
  { code: 'SEX', label: 'Sexta' },
  { code: 'SAB', label: 'Sábado' },
  { code: 'DOM', label: 'Domingo' },
]

type Props = {
  plan: WeeklyPlan | null
  loading: boolean
  loadError: string
  studyDays: WeekdayCode[]
  setStudyDays: (days: WeekdayCode[]) => void
  onGenerate: (payload: WeeklyPlanPayload) => Promise<void>
}

function dateLabel(value: string, options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short' }): string {
  return new Date(`${value}T00:00:00`).toLocaleDateString('pt-BR', options).replaceAll('.', '').toUpperCase()
}

function hoursLabel(hours: number): string {
  return `${hours.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}h`
}

function durationLabel(hours: number): string {
  const minutes = Math.round(hours * 60)
  const wholeHours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  if (!wholeHours) return `${remainingMinutes} min`
  return remainingMinutes ? `${wholeHours}h ${remainingMinutes}min` : `${wholeHours}h`
}

function weekLabel(plan: WeeklyPlan): string {
  return `${dateLabel(plan.semana_inicio)} — ${dateLabel(plan.semana_fim, { day: '2-digit', month: 'short', year: 'numeric' })}`
}

export function StudyPage({ plan, loading, loadError, studyDays, setStudyDays, onGenerate }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [hours, setHours] = useState('8')
  const [availableDays, setAvailableDays] = useState<WeekdayCode[]>(['SEG', 'TER', 'QUA', 'QUI', 'SEX'])
  const [startTime, setStartTime] = useState('09:00')
  const [generating, setGenerating] = useState(false)
  const [generateError, setGenerateError] = useState('')

  useEffect(() => {
    if (!plan) return
    setHours(String(plan.horas_semanais))
    const planDays = [...new Set(plan.sessoes.map((session) => session.dia_semana))]
    if (planDays.length) setAvailableDays(planDays)
    if (plan.sessoes[0]) setStartTime(plan.sessoes[0].horario_inicio.slice(0, 5))
  }, [plan])

  function toggleAvailableDay(day: WeekdayCode) {
    setAvailableDays((current) => current.includes(day)
      ? current.length > 1 ? current.filter((item) => item !== day) : current
      : [...current, day])
  }

  function toggleFilterDay(day: WeekdayCode) {
    setStudyDays(studyDays.includes(day)
      ? studyDays.filter((item) => item !== day)
      : [...studyDays, day])
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setGenerateError('')
    setGenerating(true)
    const payload: WeeklyPlanPayload = {
      horas_semanais: Number(hours),
      dias_disponiveis: availableDays,
      horario_inicio: `${startTime}:00`,
    }
    try {
      await onGenerate(payload)
      setShowForm(false)
    } catch (error) {
      setGenerateError(error instanceof Error ? error.message : 'Não foi possível gerar seu plano semanal.')
    } finally {
      setGenerating(false)
    }
  }

  const visibleSessions = plan?.sessoes.filter((session) => studyDays.includes(session.dia_semana)) ?? []
  const totalHours = plan?.horas_semanais ?? 0
  const focus = plan ? [...plan.sessoes].sort((left, right) => right.prioridade - left.prioridade)[0] : undefined

  return <>
    <PageHeader
      eyebrow="UM PLANO FEITO PARA VOCÊ"
      title="Plano de estudos"
      description="Uma rotina possível, com foco no que vai fazer diferença."
      action={<button className="button-secondary" onClick={() => { setShowForm((current) => !current); setGenerateError('') }} disabled={generating}><Icon name="spark" size={16} /> {showForm ? 'Fechar ajustes' : plan ? 'Ajustar plano' : 'Gerar plano'}</button>}
    />

    {loading && <p className="data-message">Carregando seu plano semanal...</p>}
    {loadError && <p className="data-error" role="alert">{loadError}</p>}

    {showForm && <form className="panel plan-generator" onSubmit={submit}>
      <div className="panel-heading"><div><span className="eyebrow">PERSONALIZE SUA ROTINA</span><h2>Gerar plano semanal</h2></div></div>
      <p className="plan-generator-description">O tempo será distribuído conforme as prioridades das suas áreas. A semana começa na segunda-feira atual.</p>
      <div className="plan-generator-fields">
        <label>Horas de estudo na semana
          <input type="number" min="0.5" max={Math.min(40, availableDays.length * 10)} step="0.5" value={hours} onChange={(event) => setHours(event.target.value)} required disabled={generating} />
          <small>Incrementos de meia hora; até 10 horas por dia disponível.</small>
        </label>
        <label>Horário de início
          <input type="time" step="1800" value={startTime} onChange={(event) => setStartTime(event.target.value)} required disabled={generating} />
        </label>
      </div>
      <fieldset className="plan-day-options">
        <legend>Dias disponíveis para estudar</legend>
        <div>{days.map((day) => <button type="button" key={day.code} className={`day-chip ${availableDays.includes(day.code) ? 'selected' : ''}`} onClick={() => toggleAvailableDay(day.code)} disabled={generating}>{day.label.slice(0, 3)}</button>)}</div>
      </fieldset>
      {generateError && <p className="data-error" role="alert">{generateError}</p>}
      <div className="plan-generator-actions"><span>Gerar novamente substitui o plano salvo para esta semana.</span><button className="button-primary" type="submit" disabled={generating}>{generating ? 'Gerando plano...' : 'Gerar plano'}</button></div>
    </form>}

    {!loading && !plan && !showForm && <section className="panel plan-empty-state">
      <span className="recommendation-icon"><Icon name="spark" size={19} /></span>
      <div><h2>Seu plano semanal ainda não foi gerado</h2><p>Cadastre uma meta e registre um simulado para a API calcular suas prioridades e montar uma rotina.</p></div>
      <button className="button-primary" onClick={() => setShowForm(true)}>Configurar semana</button>
    </section>}

    {plan && <>
      <section className="study-summary">
        <div><span className="eyebrow">SEMANA DO PLANO</span><h2>{weekLabel(plan)}</h2><p>{focus ? `Foco principal: ${focus.area_nome}${focus.topico_nome ? ` · ${focus.topico_nome}` : ''}.` : 'Seu plano foi salvo.'}</p></div>
        <div className="study-summary-stat"><strong>{hoursLabel(totalHours)}</strong><span>planejadas nesta semana</span><div className="mini-track"><i style={{ width: '100%' }} /></div></div>
        <div className="study-summary-stat"><strong>{plan.sessoes.length}</strong><span>{plan.sessoes.length === 1 ? 'sessão de estudo' : 'sessões de estudo'}</span><div className="mini-track green-track"><i style={{ width: '100%' }} /></div></div>
      </section>

      <section className="panel day-filter"><span className="filter-label">MOSTRAR DIAS</span>{days.map((day) => <button type="button" key={day.code} className={`day-chip ${studyDays.includes(day.code) ? 'selected' : ''}`} onClick={() => toggleFilterDay(day.code)}>{day.label.slice(0, 3)}</button>)}</section>

      <section className="panel schedule-panel">
        <div className="panel-heading"><div><span className="eyebrow">SUA ROTINA</span><h2>Sessões desta semana</h2></div><span className="history-caption">{visibleSessions.length} {visibleSessions.length === 1 ? 'sessão' : 'sessões'} · {hoursLabel(visibleSessions.reduce((sum, session) => sum + session.horas, 0))}</span></div>
        <div className="schedule-list">{visibleSessions.map((session) => {
          const area = areas.find((item) => item.sigla === session.area_sigla)
          return <article className="schedule-session" key={session.id}>
            <span className="schedule-day">{days.find((day) => day.code === session.dia_semana)?.label.slice(0, 3).toUpperCase()}<small>{dateLabel(session.data)}</small></span>
            <span className="task-color" style={{ background: area?.color ?? '#18856d' }} />
            <span className="schedule-time">{session.horario_inicio.slice(0, 5)}</span>
            <div className="session-info"><strong>{session.area_nome}</strong><span>{session.topico_nome ?? 'Revisão geral'}</span>{session.conteudo && <small>{session.conteudo.titulo}{session.conteudo.detalhe ? ` · ${session.conteudo.detalhe}` : ''}</small>}</div>
            <span className="session-duration"><Icon name="clock" size={14} /> {durationLabel(session.horas)}</span>
            {session.conteudo?.url
              ? <a className="task-play" href={session.conteudo.url} target="_blank" rel="noreferrer" aria-label={`Abrir ${session.conteudo.titulo}`}><Icon name="play" size={15} /></a>
              : <span className="task-play unavailable" title="Material não disponível"><Icon name="book" size={14} /></span>}
          </article>
        })}
        {visibleSessions.length === 0 && <p className="empty-history">Não há sessões nos dias selecionados.</p>}
        </div>
      </section>

      <section className="recommendation-strip"><span className="recommendation-icon"><Icon name="spark" size={19} /></span><div><strong>{plan.conteudos_disponiveis ? 'Materiais para sua semana' : 'Sugestões de conteúdo'}</strong><p>{plan.mensagem_conteudos ?? 'Os materiais estão vinculados às sessões. Use o botão ao lado de cada sessão para abrir o conteúdo.'}</p></div></section>
    </>}
  </>
}
