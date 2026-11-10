import { Icon } from './Icone'

type Props = { day: string; subject: string; topic: string; time: string; color: string; done?: boolean }

export function TaskCard({ day, subject, topic, time, color, done = false }: Props) {
  return <article className={`task-card ${done ? 'task-done' : ''}`}><div className="task-date">{day}</div><div className={`task-color ${color}`} /><div className="task-info"><strong>{subject}</strong><span>{topic}</span></div><span className="task-time"><Icon name="clock" size={14} />{time}</span>{done ? <span className="done-pill"><Icon name="check" size={13} /> Concluído</span> : <button className="task-play" aria-label={`Iniciar ${subject}`}><Icon name="play" size={15} /></button>}</article>
}
