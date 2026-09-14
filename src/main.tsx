import React from 'react';
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
import './index.css';
import './app-enhancements.css';
import './billing.css';
import './business.css';
import './team.css';
import './growth.css';
import './payment.css';
import './businessHub.css';
import './shared.css';

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => undefined));
}

const shareToken = new URLSearchParams(window.location.search).get('share');

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
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
    </>}
  </React.StrictMode>
);
