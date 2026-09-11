import React from 'react';
import { createRoot } from 'react-dom/client';
import AuthGate from './AuthGate';
import BillingCenter from './BillingCenter';
import './index.css';
import './billing.css';
createRoot(document.getElementById('root')!).render(<React.StrictMode><AuthGate /><BillingCenter /></React.StrictMode>);
