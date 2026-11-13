import { useState, type FormEvent } from 'react'
import { areas } from '../data/dadosEstudo'
import { Icon } from './Icone'
import type { AreaCode, SimulationPayload } from '../services/autenticacao'

type Props = { onClose: () => void; onSubmit: (payload: SimulationPayload) => Promise<void> }

function localDate() {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

export function SimuladoModal({ onClose, onSubmit }: Props) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError('')
    const data = new FormData(event.currentTarget)
    const notas = Object.fromEntries(areas.map((area) => [area.sigla, Number(data.get(`nota_${area.sigla}`))])) as Record<AreaCode, number>

    try {
      await onSubmit({
        realizado_em: String(data.get('realizado_em')),
        descricao: String(data.get('descricao') ?? '').trim() || null,
        notas,
      })
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Não foi possível salvar o simulado.')
      setSaving(false)
    }
  }

  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) onClose() }}>
    <form className="modal" onSubmit={submit}>
      <button type="button" className="modal-close" aria-label="Fechar" onClick={onClose} disabled={saving}>×</button>
      <span className="eyebrow">ACOMPANHE SUA EVOLUÇÃO</span>
      <h2>Novo simulado</h2>
      <p className="modal-intro">Registre as notas nas cinco áreas para atualizar seu histórico.</p>
      <label>Nome do simulado<input name="descricao" maxLength={150} placeholder="Ex.: Simulado geral 03" disabled={saving} /></label>
      <label>Data<input name="realizado_em" required type="date" defaultValue={localDate()} disabled={saving} /></label>
      <div className="form-grid">{areas.map((area) => <label key={area.sigla}>{area.name}<input name={`nota_${area.sigla}`} type="number" min="0" max="1000" step="0.01" placeholder="Nota" required disabled={saving} /></label>)}</div>
      {error && <p className="data-error" role="alert">{error}</p>}
      <div className="modal-actions"><button type="button" className="button-secondary" onClick={onClose} disabled={saving}>Cancelar</button><button className="button-primary" type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar simulado'} {!saving && <Icon name="arrow" size={16} />}</button></div>
    </form>
  </div>
}
