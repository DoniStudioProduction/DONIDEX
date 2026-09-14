import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import AuthGate from './AuthGate';
import BillingCenter from './BillingCenter';
import WorkspaceBridge from './WorkspaceBridge';
import BusinessDataBridge from './BusinessDataBridge';
import BusinessSwitcher from './BusinessSwitcher';
import TeamManagement from './TeamManagement';
import GrowthTools from './GrowthTools';
import PaymentCenter from './PaymentCenter';
import BusinessHub from './BusinessHub';
import SharedDocument from './SharedDocument';
import ShareApp from './ShareApp';
import { track } from './lib/telemetry';
import './index.css';
import './app-enhancements.css';
import './billing.css';
import './business.css';
import './team.css';
import './growth.css';
import './payment.css';
import './businessHub.css';
import './shared.css';

class AppErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
 state = { failed: false };
 static getDerivedStateFromError() { return { failed: true }; }
 componentDidCatch(error: Error, info: ErrorInfo) { track('billing_error', { source: 'react-boundary', message: error.message.slice(0, 160), componentStack: Boolean(info.componentStack) }); }
 render() { if (!this.state.failed) return this.props.children; return <main className="error-state"><div className="error-card"><p className="eyebrow">DONIDEX</p><h1>Something went wrong</h1><p>The app hit an unexpected error. Your account data has not been intentionally deleted.</p><button className="primary" onClick={() => window.location.reload()}>Reload DONIDEX</button></div></main>; }
}

if ('serviceWorker' in navigator && import.meta.env.PROD) {
 window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => undefined));
}
track('app_open', { production: Boolean(import.meta.env.PROD) });
const shareToken = new URLSearchParams(window.location.search).get('share');

createRoot(document.getElementById('root')!).render(
 <React.StrictMode>
  <AppErrorBoundary>
   {shareToken ? <SharedDocument token={shareToken} /> : <>
    <WorkspaceBridge />
    <BusinessDataBridge />
    <AuthGate />
    <BusinessSwitcher />
    <TeamManagement />
    <GrowthTools />
    <PaymentCenter />
    <BillingCenter />
    <BusinessHub />
    <ShareApp />
   </>}
  </AppErrorBoundary>
 </React.StrictMode>
);
