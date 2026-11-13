import { Icon } from './Icone'

type Props = { icon: string; label: string; value: string; suffix: string; detail: string; positive?: boolean }

export function StatCard({ icon, label, value, suffix, detail, positive = false }: Props) {
  return <article className="stat-card"><div className="stat-top"><span>{label}</span><Icon name={icon} size={17} /></div><div className="stat-value">{value}<small>{suffix}</small></div><div className={`stat-detail ${positive ? 'positive' : ''}`}>{positive && <span>↗</span>} {detail}</div></article>
}
