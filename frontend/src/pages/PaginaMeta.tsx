import { useEffect, useState, type FormEvent } from 'react'
import { areas } from '../data/dadosEstudo'
import { Icon } from '../components/Icone'
import { PageHeader } from '../components/CabecalhoPagina'
import type { AreaCode, Goal, GoalPayload } from '../services/autenticacao'

type FormArea = { sigla: AreaCode; nota_alvo: string; peso: number }
type GoalForm = { curso: string; nota_corte: string; data_prova: string; areas: FormArea[] }

type Props = {
  goal: Goal | null
  loading: boolean
  loadError: string
  onSave: (payload: GoalPayload) => Promise<void>
}

function emptyGoalForm(): GoalForm {
  return {
    curso: '',
    nota_corte: '',
    data_prova: '',
    areas: areas.map((area, index) => ({
      sigla: area.sigla,
      nota_alvo: String(area.goal),
      peso: index === 0 ? 3 : index === 1 ? 2 : 1,
    })),
  }
}

function goalToForm(goal: Goal): GoalForm {
  return {
    curso: goal.curso,
    nota_corte: goal.nota_corte === null ? '' : String(goal.nota_corte),
    data_prova: goal.data_prova ?? '',
    areas: areas.map((area) => {
      const savedArea = goal.areas.find((item) => item.sigla === area.sigla)
      return {
        sigla: area.sigla,
        nota_alvo: savedArea ? String(savedArea.nota_alvo) : String(area.goal),
        peso: savedArea ? Math.max(1, Math.min(3, Math.round(savedArea.peso))) : 1,
      }
    }),
  }
}

export function GoalPage({ goal, loading, loadError, onSave }: Props) {
  const [form, setForm] = useState<GoalForm>(emptyGoalForm)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    if (!loading) setForm(goal ? goalToForm(goal) : emptyGoalForm())
  }, [goal, loading])

  function update<K extends keyof GoalForm>(key: K, value: GoalForm[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function updateArea(sigla: AreaCode, field: 'nota_alvo' | 'peso', value: string | number) {
    setForm((current) => ({
      ...current,
      areas: current.areas.map((area) => area.sigla === sigla ? { ...area, [field]: value } : area),
    }))
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaveError('')
    setSaving(true)
    const payload: GoalPayload = {
      curso: form.curso.trim(),
      nota_corte: form.nota_corte === '' ? null : Number(form.nota_corte),
      data_prova: form.data_prova || null,
      areas: form.areas.map((area) => ({
        sigla: area.sigla,
        nota_alvo: Number(area.nota_alvo),
        peso: area.peso,
      })),
    }

    try {
      await onSave(payload)
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Não foi possível salvar a meta.')
    } finally {
      setSaving(false)
    }
  }

  const displayGoal = goal !== null

  return <>
    <PageHeader eyebrow="SEU NORTE, NO SEU TEMPO" title="Minha meta" description="Um objetivo claro ajuda a dar sentido a cada sessão de estudo." />
    <section className="goal-hero">
      <div className="goal-hero-label"><Icon name="target" size={16} /> OBJETIVO PRINCIPAL</div>
      <div className="goal-degree">{displayGoal ? goal.curso : 'Defina seu objetivo'}</div>
      <p>{displayGoal ? 'Sua meta está salva e pode ser atualizada quando quiser.' : 'Preencha os dados abaixo para registrar sua meta de estudos.'}</p>
      <div className="goal-hero-bottom">
        <span>NOTA DE REFERÊNCIA</span>
        <strong>{displayGoal && goal.nota_corte !== null ? goal.nota_corte : '—'} <small>{displayGoal && goal.nota_corte !== null ? 'pontos' : ''}</small></strong>
        <span className="goal-status">{displayGoal ? 'Em andamento' : 'Ainda não cadastrada'}</span>
      </div>
    </section>

    <form className="panel goal-details" onSubmit={submit}>
      <div className="panel-heading"><div><span className="eyebrow">CONFIGURAÇÃO</span><h2>Detalhes da meta</h2></div><span className="edit-hint">Salva no seu perfil</span></div>
      {loading && <p className="data-message">Carregando sua meta...</p>}
      <div className="goal-fields">
        <label>Curso desejado<input value={form.curso} onChange={(event) => update('curso', event.target.value)} maxLength={100} required disabled={saving || loading} placeholder="Ex.: Medicina" /></label>
        <label>Nota de referência<input type="number" min="0" max="1000" step="0.01" value={form.nota_corte} onChange={(event) => update('nota_corte', event.target.value)} disabled={saving || loading} placeholder="Ex.: 720" /></label>
        <label>Data da prova<input type="date" value={form.data_prova} onChange={(event) => update('data_prova', event.target.value)} disabled={saving || loading} /></label>
      </div>
      <div className="panel-subheading"><div><strong>Peso e nota-alvo por área</strong><span>Defina uma nota desejada e um peso de 1 a 3.</span></div><span className="weight-legend">1 <i /> 3</span></div>
      <div className="weight-list">{form.areas.map((item) => {
        const area = areas.find((studyArea) => studyArea.sigla === item.sigla)
        if (!area) return null
        return <div className="goal-area-row" key={item.sigla}>
          <span className="area-color" style={{ background: area.color }} />
          <span className="goal-area-name">{area.name}</span>
          <label className="goal-target">Nota-alvo<input type="number" min="0" max="1000" step="0.01" value={item.nota_alvo} onChange={(event) => updateArea(item.sigla, 'nota_alvo', event.target.value)} required disabled={saving || loading} /></label>
          <label className="goal-weight">Peso<input type="range" min="1" max="3" step="1" value={item.peso} onChange={(event) => updateArea(item.sigla, 'peso', Number(event.target.value))} aria-label={`Peso de ${area.name}`} disabled={saving || loading} /><strong>{item.peso}</strong></label>
        </div>
      })}</div>
      {(saveError || loadError) && <p className="data-error" role="alert">{saveError || loadError}</p>}
      <div className="goal-save"><span>{goal ? `Meta criada em ${new Date(goal.criado_em).toLocaleDateString('pt-BR')}` : 'As sugestões de notas são iniciais; salve para registrar sua meta.'}</span><button className="button-primary" type="submit" disabled={saving || loading}>{saving ? 'Salvando...' : 'Salvar meta'} <Icon name="check" size={16} /></button></div>
    </form>
  </>
}
