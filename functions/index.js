const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const crypto = require('crypto');

initializeApp();
const db = getFirestore();
const PAYSTACK_SECRET_KEY = defineSecret('PAYSTACK_SECRET_KEY');

const plans = new Map([
  ['PLN_fddms19tdyvx7qj', { name: 'Premium', interval: 'month', amount: 500000 }],
  ['PLN_jxtfbc7tqwiw4sj', { name: 'Premium', interval: 'year', amount: 5000000 }],
  ['PLN_ifmkg82hnjhsqsa', { name: 'Business / Team', interval: 'month', amount: 1500000 }],
  ['PLN_mcf5d8a1eik3i3x', { name: 'Business / Team', interval: 'year', amount: 15000000 }],
]);

function cors(res, origin) {
  const allowed = origin === 'https://donidex.netlify.app' || /^https?:\/\/localhost(?::\d+)?$/.test(origin || '');
  if (allowed) res.set('Access-Control-Allow-Origin', origin);
  res.set('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  res.set('Access-Control-Max-Age', '3600');
}

async function paystack(path, options = {}) {
  const secret = PAYSTACK_SECRET_KEY.value();
  if (!secret) throw new Error('PAYSTACK_SECRET_KEY is not configured.');
  const response = await fetch(`https://api.paystack.co${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  const data = await response.json().catch(() => null);
  return { response, data };
}

async function saveEntitlement(uid, email, plan, reference, subscriptionCode, active) {
  if (!uid) return;
  await db.collection('billingEntitlements').doc(uid).set({
    uid, email: email || null, plan: plan?.name || 'Paid', interval: plan?.interval || null,
    reference: reference || null, subscriptionCode: subscriptionCode || null, active: Boolean(active),
    source: 'paystack', updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
}

exports.paystackBilling = onRequest({ region: 'us-central1', secrets: [PAYSTACK_SECRET_KEY], timeoutSeconds: 30 }, async (req, res) => {
  cors(res, req.get('origin') || '');
  if (req.method === 'OPTIONS') return res.status(204).send('');

  const route = String(req.path || '/').replace(/^\/+|\/+$/g, '');
  try {
    if (route === 'catalog' && req.method === 'GET') {
      return res.json({ prices: [...plans.entries()].map(([priceId, p], i) => ({ key: `${p.name}-${p.interval}-${i}`, name: p.name, interval: p.interval, amount: p.amount / 100, priceId })) });
    }

    if (route === 'checkout' && req.method === 'POST') {
      const { priceId, customerEmail, userId } = req.body || {};
      const plan = plans.get(String(priceId || ''));
      if (!plan) return res.status(400).json({ error: 'Unknown or unconfigured Paystack plan.' });
      if (!customerEmail) return res.status(400).json({ error: 'Customer email is required.' });
      const callbackUrl = String(req.body?.callbackUrl || 'https://donidex.netlify.app/?billing=paystack-return');
      const payload = {
        email: customerEmail,
        plan: priceId,
        callback_url: callbackUrl,
        metadata: { userId: userId || null, email: customerEmail, planCode: priceId },
      };
      const { response, data } = await paystack('/transaction/initialize', { method: 'POST', body: JSON.stringify(payload) });
      if (!response.ok || !data?.status || !data?.data?.authorization_url) return res.status(502).json({ error: data?.message || 'Paystack checkout could not be created.' });
      return res.json({ url: data.data.authorization_url, reference: data.data.reference, accessCode: data.data.access_code });
    }

    if (route === 'status' && req.method === 'GET') {
      const email = String(req.query.email || '').trim();
      if (!email) return res.status(400).json({ error: 'Email is required.' });
      const snapshot = await db.collection('billingEntitlements').where('email', '==', email).limit(1).get();
      if (!snapshot.empty) {
        const entitlement = snapshot.docs[0].data();
        if (entitlement.active) return res.json({ plan: entitlement.plan, status: 'active', entitlementActive: true, subscriptionId: entitlement.subscriptionCode || null, source: entitlement.source || 'paystack' });
      }
      const { response, data } = await paystack(`/customer/${encodeURIComponent(email)}`);
      if (response.status === 404) return res.json({ plan: 'Free', status: 'none', entitlementActive: false });
      if (!response.ok || !data?.status) return res.status(502).json({ error: data?.message || 'Could not read Paystack customer billing.' });
      const subscriptions = Array.isArray(data.data?.subscriptions) ? data.data.subscriptions : [];
      const preferred = subscriptions.find(s => ['active', 'non-renewing', 'attention'].includes(String(s.status).toLowerCase())) || subscriptions[0];
      if (!preferred) return res.json({ plan: 'Free', status: 'none', entitlementActive: false, customerId: data.data?.customer_code || null });
      const planCode = String(preferred.plan?.plan_code || preferred.plan?.code || preferred.plan?.id || '');
      const status = String(preferred.status || 'unknown').toLowerCase();
      const plan = plans.get(planCode);
      return res.json({ plan: plan?.name || 'Paid', status, subscriptionId: preferred.subscription_code || preferred.id || null, customerId: data.data?.customer_code || null, planCode, entitlementActive: ['active', 'non-renewing'].includes(status) });
    }

    if (route === 'portal' && req.method === 'POST') {
      const { subscriptionCode } = req.body || {};
      if (!subscriptionCode) return res.status(400).json({ error: 'A Paystack subscription code is required.' });
      const { response, data } = await paystack(`/subscription/${encodeURIComponent(subscriptionCode)}/manage/link`);
      if (!response.ok || !data?.status || !data?.data?.link) return res.status(502).json({ error: data?.message || 'Paystack subscription management link could not be created.' });
      return res.json({ url: data.data.link });
    }

    if (route === 'webhook' && req.method === 'POST') {
      const signature = req.get('x-paystack-signature') || '';
      const raw = req.rawBody ? req.rawBody.toString('utf8') : JSON.stringify(req.body || {});
      const expected = crypto.createHmac('sha512', PAYSTACK_SECRET_KEY.value()).update(raw).digest('hex');
      if (!signature || signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) return res.status(400).json({ error: 'Invalid Paystack webhook signature.' });
      const event = typeof req.body === 'object' ? req.body : JSON.parse(raw);
      const data = event.data || {};
      const customer = typeof data.customer === 'object' && data.customer ? data.customer : {};
      const metadata = data.metadata || {};
      const email = metadata.email || customer.email || null;
      const uid = metadata.userId || null;
      const planCode = String(metadata.planCode || data.plan?.plan_code || data.plan?.code || '');
      const plan = plans.get(planCode);
      const reference = data.reference || null;
      const subscriptionCode = data.subscription_code || data.subscription?.subscription_code || null;
      const active = event.event === 'charge.success' || event.event === 'subscription.create' || event.event === 'invoice.update' && String(data.status).toLowerCase() === 'success';
      const disabled = event.event === 'subscription.disable' || event.event === 'subscription.not_renew' || event.event === 'invoice.payment_failed';
      if (email && (uid || plan)) await saveEntitlement(uid, email, plan, reference, subscriptionCode, disabled ? false : active);
      console.log(JSON.stringify({ source: 'paystack', event: event.event, reference, subscription: subscriptionCode, email, uid, planCode }));
      return res.json({ received: true });
    }

    return res.status(404).json({ error: 'Paystack billing route not found.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Paystack billing service failed.' });
  }
});
