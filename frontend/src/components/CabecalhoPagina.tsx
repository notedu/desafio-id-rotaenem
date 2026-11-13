import type { ReactNode } from 'react'

type Props = { eyebrow: string; title: ReactNode; description: string; action?: ReactNode }

export function PageHeader({ eyebrow, title, description, action }: Props) {
  return <section className="welcome-row"><div><div className="eyebrow"><span className="eyebrow-line" /> {eyebrow}</div><h1>{title}</h1><p className="welcome-subtitle">{description}</p></div>{action}</section>
}
