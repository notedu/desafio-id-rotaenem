import type { ReactNode } from 'react'
import { navItems } from '../data/dadosEstudo'
import type { Page } from '../types/navegacao'
import { Icon } from './Icone'

type Props = {
  page: Page
  title: string
  studentName: string
  onNavigate: (page: Page) => void
  onLogout: () => void
  children: ReactNode
}

export function AppShell({ page, title, studentName, onNavigate, onLogout, children }: Props) {
  const initials = studentName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

  return <div className="app-shell">
    <aside className="sidebar">
      <a className="brand" href="#inicio" onClick={(event) => { event.preventDefault(); onNavigate('inicio') }}><span className="brand-mark"><span>R</span></span><span className="brand-copy"><strong>rota<span>enem</span></strong><small>SEU CAMINHO ATÉ A APROVAÇÃO</small></span></a>
      <div className="side-label">MENU PRINCIPAL</div>
      <nav className="nav-list" aria-label="Navegação principal">{navItems.map((item) => <button key={item.id} className={`nav-item ${page === item.id ? 'active' : ''}`} onClick={() => onNavigate(item.id)}><Icon name={item.icon} /><span>{item.label}</span>{item.id === 'plano' && <span className="nav-dot" />}</button>)}</nav>
      <div className="sidebar-spacer" />
      <div className="profile-actions">
        <div className="profile"><span className="avatar">{initials}</span><span className="profile-name"><strong>{studentName}</strong><small>Conta autenticada</small></span></div>
        <button className="logout-button" type="button" onClick={onLogout} aria-label="Sair da conta" title="Sair da conta"><Icon name="logout" size={17} /><span>Sair</span></button>
      </div>
    </aside>
    <main className="main-area">
      <header className="topbar"><div className="breadcrumb">RotaENEM <span>/</span> <strong>{title}</strong></div></header>
      <div className="page-wrap">{children}</div>
    </main>
  </div>
}
