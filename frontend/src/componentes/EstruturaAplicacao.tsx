import type { ReactNode } from 'react'
import { navItems } from '../dados/dadosEstudo'
import type { Page } from '../tipos/navegacao'
import { Icon } from './Icone'

type Props = { page: Page; title: string; onNavigate: (page: Page) => void; onNotify: () => void; children: ReactNode }

export function AppShell({ page, title, onNavigate, onNotify, children }: Props) {
  return <div className="app-shell">
    <aside className="sidebar">
      <a className="brand" href="#inicio" onClick={(event) => { event.preventDefault(); onNavigate('inicio') }}><span className="brand-mark"><span>R</span></span><span className="brand-copy"><strong>rota<span>enem</span></strong><small>SEU CAMINHO ATÉ A APROVAÇÃO</small></span></a>
      <div className="side-label">MENU PRINCIPAL</div>
      <nav className="nav-list" aria-label="Navegação principal">{navItems.map((item) => <button key={item.id} className={`nav-item ${page === item.id ? 'active' : ''}`} onClick={() => onNavigate(item.id)}><Icon name={item.icon} /><span>{item.label}</span>{item.id === 'plano' && <span className="nav-dot" />}</button>)}</nav>
      <div className="sidebar-spacer" />
      <div className="help-card"><span className="help-icon"><Icon name="spark" size={17} /></span><strong>Um passo de cada vez.</strong><p>Consistência vale mais que estudar tudo de uma vez.</p><button onClick={() => onNavigate('plano')}>Ver meu plano <Icon name="arrow" size={15} /></button></div>
      <button className="profile"><span className="avatar">ML</span><span className="profile-name"><strong>Mariana Lima</strong><small>Plano gratuito</small></span><span className="profile-more">···</span></button>
    </aside>
    <main className="main-area">
      <header className="topbar"><div className="breadcrumb">RotaENEM <span>/</span> <strong>{title}</strong></div><div className="top-actions"><span className="exam-pill"><span className="live-dot" /> ENEM 2026</span><button className="icon-button notification" aria-label="Notificações" onClick={onNotify}><Icon name="bell" size={19} /><i /></button></div></header>
      <div className="page-wrap">{children}</div>
    </main>
  </div>
}
