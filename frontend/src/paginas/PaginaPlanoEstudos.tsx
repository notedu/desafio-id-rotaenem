import { studySessions } from '../dados/dadosEstudo'
import { Icon } from '../componentes/Icone'
import { PageHeader } from '../componentes/CabecalhoPagina'

const days = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo']

type Props = { studyDays: string[]; setStudyDays: (days: string[]) => void }

export function StudyPage({ studyDays, setStudyDays }: Props) {
  function toggleDay(day: string) {
    setStudyDays(studyDays.includes(day) ? studyDays.filter((item) => item !== day) : [...studyDays, day])
  }

  return <>
    <PageHeader eyebrow="UM PLANO FEITO PARA VOCÊ" title="Plano de estudos" description="Uma rotina possível, com foco no que vai fazer diferença." action={<button className="button-secondary"><Icon name="spark" size={16} /> Ajustar plano</button>} />
    <section className="study-summary"><div><span className="eyebrow">SEMANA ATUAL</span><h2>9 a 15 de novembro</h2><p>Seu foco principal é Matemática e Ciências da Natureza.</p></div><div className="study-summary-stat"><strong>12,5 <small>h</small></strong><span>de 18h planejadas</span><div className="mini-track"><i /></div></div><div className="study-summary-stat"><strong>3 <small>/ 6</small></strong><span>sessões concluídas</span><div className="mini-track green-track"><i /></div></div></section>
    <section className="panel day-filter"><span className="filter-label">MOSTRAR DIAS</span>{days.map((day) => <button key={day} className={`day-chip ${studyDays.includes(day) ? 'selected' : ''}`} onClick={() => toggleDay(day)}>{day.slice(0, 3)}</button>)}</section>
    <section className="panel schedule-panel"><div className="panel-heading"><div><span className="eyebrow">SUA ROTINA</span><h2>Sessões desta semana</h2></div><span className="history-caption">6 sessões · 7h 30min restantes</span></div><div className="schedule-list">{studySessions.filter((session) => studyDays.includes(session.day)).map((session, index) => <article className="schedule-session" key={`${session.day}${session.time}`}><span className="schedule-day">{session.day.slice(0, 3).toUpperCase()}<small>{9 + index} NOV</small></span><span className={`task-color ${session.color}`} /><span className="schedule-time">{session.time}</span><div className="session-info"><strong>{session.subject}</strong><span>{session.topic}</span></div><span className="session-duration"><Icon name="clock" size={14} /> {session.duration}</span><button className="task-play" aria-label={`Ver material de ${session.subject}`}><Icon name="play" size={15} /></button></article>)}</div></section>
    <section className="recommendation-strip"><span className="recommendation-icon"><Icon name="spark" size={19} /></span><div><strong>Uma dica para sua próxima sessão</strong><p>Comece por exercícios de função quadrática: esse tópico tem alto peso e pode trazer um bom ganho na sua nota.</p></div><button aria-label="Ver recomendação"><Icon name="chevron" size={18} /></button></section>
  </>
}
