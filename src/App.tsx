import { useState } from 'react';
import { BarChart3, ChevronDown, FileText, LayoutDashboard, LogIn, Users, WalletCards } from 'lucide-react';

const features = [
  ['Invoices', 'Create, track and share professional invoices.'],
  ['Customers', 'Keep customer records and payment history organized.'],
  ['Expenses', 'Track business spending and operating costs.'],
  ['Reports', 'See revenue, outstanding balances and business insights.'],
  ['Multi-business', 'Separate workspaces and business-specific data.'],
  ['Payments', 'Record payments and connect subscription billing.'],
];

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [view, setView] = useState('Dashboard');
  return <div className="app-shell">
    <header className="topbar">
      <button className="brand" onClick={() => setMenuOpen(v => !v)} aria-expanded={menuOpen}>
        <span className="brand-mark">D</span><span>DONIDEX</span><ChevronDown size={16}/>
      </button>
      {menuOpen && <div className="brand-menu">
        <button onClick={() => setView('Profile')}>User Profile</button>
        <button onClick={() => setView('Business Settings')}>Business Settings</button>
        <button onClick={() => setView('Security')}>Security & Account</button>
        <button onClick={() => setView('Plans')}>Plans & Billing</button>
      </div>}
      <button className="login"><LogIn size={16}/> Sign in</button>
    </header>
    <main>
      <section className="hero">
        <div><p className="eyebrow">DONIDEX BUSINESS OPERATIONS</p><h1>Run your business from one place.</h1><p className="lead">Invoices, customers, expenses, payments, reports and multi-business operations — built mobile-first for growing businesses.</p><div className="actions"><button className="primary" onClick={() => setView('Dashboard')}>Open Dashboard</button><button className="secondary" onClick={() => setView('Plans')}>View Plans</button></div></div>
        <div className="hero-card"><div className="hero-icon"><LayoutDashboard size={22}/></div><strong>Migration build</strong><span>GitHub → Netlify</span><small>The existing AppDeploy build remains untouched as the reference version.</small></div>
      </section>
      <section className="section-head"><div><p className="eyebrow">CORE WORKSPACE</p><h2>{view}</h2></div><span className="status">Migration foundation active</span></section>
      <section className="feature-grid">{features.map(([title, copy], i) => <article className="card" key={title}><div className="card-icon">{i === 0 ? <FileText/> : i === 1 ? <Users/> : i === 2 ? <WalletCards/> : <BarChart3/>}</div><h3>{title}</h3><p>{copy}</p></article>)}</section>
      <section className="pricing"><div><p className="eyebrow">LOCKED PRICING</p><h2>Simple plans that scale.</h2></div><div className="price-grid"><div><strong>FREE</strong><b>₦0</b><span>Core business tools</span></div><div className="featured"><strong>PREMIUM</strong><b>₦5,000<span>/month</span></b><span>₦50,000/year</span></div><div><strong>BUSINESS / TEAM</strong><b>₦15,000<span>/month</span></b><span>₦150,000/year</span></div></div></section>
    </main>
  </div>;
}
