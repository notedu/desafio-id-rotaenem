import { Icon } from './Icone'

export function Toast({ message }: { message: string }) {
  if (!message) return null
  return <div className="toast"><span className="toast-check"><Icon name="check" size={16} /></span>{message}</div>
}
