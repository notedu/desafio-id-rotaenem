import type { FormEvent } from 'react'
import { areas } from '../dados/dadosEstudo'
import { Icon } from './Icone'

type Props = { onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }

export function SimuladoModal({ onClose, onSubmit }: Props) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><form className="modal" onSubmit={onSubmit}><button type="button" className="modal-close" aria-label="Fechar" onClick={onClose}>×</button><span className="eyebrow">ACOMPANHE SUA EVOLUÇÃO</span><h2>Novo simulado</h2><p className="modal-intro">Registre suas notas para atualizar suas prioridades de estudo.</p><label>Nome do simulado<input required placeholder="Ex.: Simulado geral 03" /></label><label>Data<input required type="date" defaultValue={new Date().toISOString().slice(0, 10)} /></label><div className="form-grid">{areas.map((area) => <label key={area.short}>{area.name}<input type="number" min="0" max="1000" placeholder="Nota" /></label>)}</div><div className="modal-actions"><button type="button" className="button-secondary" onClick={onClose}>Cancelar</button><button className="button-primary" type="submit">Salvar simulado <Icon name="arrow" size={16} /></button></div></form></div>
}
