import { Icon } from './Icone'

type Props = { day: string; subject: string; topic: string; time: string; color: string; href?: string }

export function TaskCard({ day, subject, topic, time, color, href }: Props) {
  return <article className="task-card"><div className="task-date">{day}</div><div className={`task-color ${color}`} /><div className="task-info"><strong>{subject}</strong><span>{topic}</span></div><span className="task-time"><Icon name="clock" size={15} />{time}</span>{href && <a className="task-play" href={href} target="_blank" rel="noreferrer" aria-label={`Abrir ${topic}`}><Icon name="play" size={15} /></a>}</article>
}
