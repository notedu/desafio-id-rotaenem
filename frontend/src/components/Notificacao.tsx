import { Icon } from './Icone'

type Props = { message: string; variant?: 'success' | 'error' }

export function Toast({ message, variant = 'success' }: Props) {
  if (!message) return null
  return <div className={`toast toast-${variant}`} role={variant === 'error' ? 'alert' : 'status'}><span className="toast-check"><Icon name={variant === 'error' ? 'spark' : 'check'} size={16} /></span>{message}</div>
}
