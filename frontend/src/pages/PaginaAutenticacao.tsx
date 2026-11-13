import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Icon } from '../components/Icone'
import { Toast } from '../components/Notificacao'
import { loginStudent, registerStudent, type AuthSession } from '../services/autenticacao'

type Props = { onAuthenticated: (session: AuthSession) => void }
type Mode = 'login' | 'register'

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Não foi possível concluir. Tente novamente.'
}

export function AuthenticationPage({ onAuthenticated }: Props) {
  const [mode, setMode] = useState<Mode>('login')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const redirectTimer = useRef<number | null>(null)

  useEffect(() => () => {
    if (redirectTimer.current !== null) window.clearTimeout(redirectTimer.current)
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSuccessMessage('')
    setIsSubmitting(true)

    const values = new FormData(event.currentTarget)
    const email = String(values.get('email') ?? '').trim()
    const senha = String(values.get('senha') ?? '')

    try {
      if (mode === 'login') {
        const session = await loginStudent(email, senha)
        onAuthenticated(session)
        return
      }

      const nome = String(values.get('nome') ?? '').trim()
      const uf = String(values.get('uf') ?? '').trim().toUpperCase()
      await registerStudent({ nome, email, senha, ...(uf ? { uf } : {}) })
      const session = await loginStudent(email, senha)
      setSuccessMessage('Usuário cadastrado! Redirecionando para o sistema...')
      redirectTimer.current = window.setTimeout(() => onAuthenticated(session), 1700)
    } catch (submitError) {
      setError(errorMessage(submitError))
      setIsSubmitting(false)
    }
  }

  function changeMode(nextMode: Mode) {
    setMode(nextMode)
    setError('')
    setSuccessMessage('')
  }

  return <main className="auth-page">
    <section className="auth-showcase" aria-label="RotaENEM">
      <a className="auth-brand" href="#inicio" aria-label="RotaENEM">
        <span className="brand-mark"><span>R</span></span>
        <span className="brand-copy"><strong>rota<span>enem</span></strong><small>SEU CAMINHO ATÉ A APROVAÇÃO</small></span>
      </a>
      <div className="auth-showcase-copy">
        <span className="auth-kicker"><Icon name="spark" size={16} /> SUA JORNADA COMEÇA AQUI</span>
        <h1>Um plano claro.<br /><span>Um passo de cada vez.</span></h1>
        <p>Acompanhe sua evolução e encontre o melhor caminho para chegar à sua meta no ENEM.</p>
      </div>
      <div className="auth-showcase-note"><span>✳</span><div><strong>Estude com direção</strong><small>Seu esforço, organizado em uma rota possível.</small></div></div>
      <div className="auth-decor auth-decor-one" /><div className="auth-decor auth-decor-two" />
    </section>

    <section className="auth-panel">
      <div className="auth-card">
        <div className="auth-mobile-brand"><span className="brand-mark"><span>R</span></span><strong>rota<span>enem</span></strong></div>
        <span className="eyebrow">{mode === 'login' ? 'BEM-VINDA DE VOLTA' : 'COMECE SUA JORNADA'}</span>
        <h2>{mode === 'login' ? 'Acesse sua conta' : 'Crie sua conta'}</h2>
        <p className="auth-description">{mode === 'login' ? 'Entre para continuar acompanhando seu plano.' : 'Seus dados ficam prontos para acompanhar sua evolução.'}</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === 'register' && <label>Nome completo<input name="nome" type="text" autoComplete="name" minLength={2} maxLength={100} placeholder="Como podemos te chamar?" required disabled={isSubmitting} /></label>}
          <label>E-mail<input name="email" type="email" autoComplete="email" placeholder="voce@exemplo.com" required disabled={isSubmitting} /></label>
          <label>Senha<input name="senha" type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={mode === 'register' ? 8 : undefined} maxLength={128} placeholder={mode === 'register' ? 'Pelo menos 8 caracteres' : 'Digite sua senha'} required disabled={isSubmitting} /></label>
          {mode === 'register' && <label>Estado (opcional)<input name="uf" type="text" autoComplete="address-level1" maxLength={2} pattern="[A-Za-z]{2}" placeholder="Ex.: SP" disabled={isSubmitting} /></label>}
          {error && <p className="auth-error" role="alert">{error}</p>}
          <button className="button-primary auth-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? mode === 'login' ? 'Entrando...' : successMessage ? 'Redirecionando...' : 'Cadastrando...'
              : mode === 'login' ? 'Fazer login' : 'Criar conta'}
            {!isSubmitting && <Icon name="arrow" size={16} />}
          </button>
        </form>

        <div className="auth-switch">
          {mode === 'login' ? 'Ainda não tem cadastro?' : 'Já tem uma conta?'}
          <button type="button" onClick={() => changeMode(mode === 'login' ? 'register' : 'login')} disabled={isSubmitting}>
            {mode === 'login' ? 'Criar conta' : 'Fazer login'}
          </button>
        </div>
        <p className="auth-privacy">Sua senha é protegida e não aparece no seu perfil.</p>
      </div>
    </section>
    <Toast message={successMessage} />
  </main>
}

export function SessionLoading() {
  return <main className="auth-loading"><span className="brand-mark"><span>R</span></span><p>Verificando sua sessão...</p></main>
}
