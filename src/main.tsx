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
import './index.css';
import './billing.css';
import './business.css';
import './team.css';
import './growth.css';
import './payment.css';

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => undefined));
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><WorkspaceBridge /><BusinessDataBridge /><AuthGate /><BusinessSwitcher /><TeamManagement /><GrowthTools /><PaymentCenter /><BillingCenter /></React.StrictMode>);
