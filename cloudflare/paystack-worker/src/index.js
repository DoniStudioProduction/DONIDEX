const PLANS = new Map([
  ['PLN_fddms19tdyvx7qj', { name: 'Premium', interval: 'month', amount: 500000 }],
  ['PLN_jxtfbc7tqwiw4sj', { name: 'Premium', interval: 'year', amount: 5000000 }],
  ['PLN_ifmkg82hnjhsqsa', { name: 'Business / Team', interval: 'month', amount: 1500000 }],
  ['PLN_mcf5d8a1eik3i3x', { name: 'Business / Team', interval: 'year', amount: 15000000 }],
]);

const ALLOWED_ORIGINS = new Set(['https://donidex.netlify.app']);

function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.has(origin) || /^https?:\/\/localhost(?::\d+)?$/.test(origin || '');
  return {
    'Access-Control-Allow-Origin': allowed ? origin : 'https://donidex.netlify.app',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

function json(data, status, origin) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) } });
}

async function paystack(path, env, init = {}) {
  if (!env.PAYSTACK_SECRET_KEY) throw new Error('Paystack secret is not configured on the payment backend.');
  const response = await fetch(`https://api.paystack.co${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`, 'Content-Type': 'application/json', ...(init.headers || {}) },
  });
  const data = await response.json().catch(() => null);
  return { response, data };
}

function hex(buffer) {
  return [...new Uint8Array(buffer)].map(b => b.toString(16).padStart(2, '0')).join('');
}

async function verifyWebhook(rawBody, signature, secret) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-512' }, false, ['sign']);
  const digest = hex(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(rawBody)));
  return digest.length === signature.length && digest === signature;
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(origin) });
    const url = new URL(request.url);
    const route = url.pathname.replace(/^\/+|\/+$/g, '');

    try {
      if (route === 'catalog' && request.method === 'GET') {
        return json({ prices: [...PLANS.entries()].map(([priceId, p], i) => ({ key: `${p.name}-${p.interval}-${i}`, name: p.name, interval: p.interval, amount: p.amount / 100, priceId })) }, 200, origin);
      }

      if (route === 'checkout' && request.method === 'POST') {
        const body = await request.json().catch(() => null);
        const priceId = String(body?.priceId || '');
        const customerEmail = String(body?.customerEmail || '').trim();
        const userId = body?.userId || null;
        const plan = PLANS.get(priceId);
        if (!plan) return json({ error: 'Unknown or unconfigured Paystack plan.' }, 400, origin);
        if (!customerEmail) return json({ error: 'Customer email is required.' }, 400, origin);
        const callbackUrl = String(body?.callbackUrl || 'https://donidex.netlify.app/?billing=paystack-return');
        const { response, data } = await paystack('/transaction/initialize', env, {
          method: 'POST',
          body: JSON.stringify({ email: customerEmail, plan: priceId, callback_url: callbackUrl, metadata: { userId, email: customerEmail, planCode: priceId } }),
        });
        if (!response.ok || !data?.status || !data?.data?.authorization_url) return json({ error: data?.message || 'Paystack checkout could not be created.' }, 502, origin);
        return json({ url: data.data.authorization_url, reference: data.data.reference, accessCode: data.data.access_code }, 200, origin);
      }

      if (route === 'status' && request.method === 'GET') {
        const email = String(url.searchParams.get('email') || '').trim();
        if (!email) return json({ error: 'Email is required.' }, 400, origin);
        const { response, data } = await paystack(`/customer/${encodeURIComponent(email)}`, env);
        if (response.status === 404) return json({ plan: 'Free', status: 'none', entitlementActive: false }, 200, origin);
        if (!response.ok || !data?.status) return json({ error: data?.message || 'Could not read Paystack customer billing.' }, 502, origin);
        const subscriptions = Array.isArray(data.data?.subscriptions) ? data.data.subscriptions : [];
        const preferred = subscriptions.find(s => ['active', 'non-renewing', 'attention'].includes(String(s.status).toLowerCase())) || subscriptions[0];
        if (!preferred) return json({ plan: 'Free', status: 'none', entitlementActive: false, customerId: data.data?.customer_code || null }, 200, origin);
        const planCode = String(preferred.plan?.plan_code || preferred.plan?.code || preferred.plan?.id || '');
        const status = String(preferred.status || 'unknown').toLowerCase();
        const plan = PLANS.get(planCode);
        return json({ plan: plan?.name || 'Paid', status, subscriptionId: preferred.subscription_code || preferred.id || null, customerId: data.data?.customer_code || null, planCode, entitlementActive: ['active', 'non-renewing'].includes(status) }, 200, origin);
      }

      if (route === 'portal' && request.method === 'POST') {
        const body = await request.json().catch(() => null);
        const subscriptionCode = String(body?.subscriptionCode || '');
        if (!subscriptionCode) return json({ error: 'A Paystack subscription code is required.' }, 400, origin);
        const { response, data } = await paystack(`/subscription/${encodeURIComponent(subscriptionCode)}/manage/link`, env);
        if (!response.ok || !data?.status || !data?.data?.link) return json({ error: data?.message || 'Paystack subscription management link could not be created.' }, 502, origin);
        return json({ url: data.data.link }, 200, origin);
      }

      if (route === 'webhook' && request.method === 'POST') {
        const rawBody = await request.text();
        const signature = request.headers.get('x-paystack-signature') || '';
        if (!signature || !await verifyWebhook(rawBody, signature, env.PAYSTACK_SECRET_KEY)) return json({ error: 'Invalid Paystack webhook signature.' }, 400, origin);
        const event = JSON.parse(rawBody);
        console.log(JSON.stringify({ source: 'paystack', event: event.event || null, reference: event.data?.reference || null, subscription: event.data?.subscription_code || null }));
        return json({ received: true }, 200, origin);
      }

      return json({ error: 'Paystack route not found.' }, 404, origin);
    } catch (error) {
      console.error(error);
      return json({ error: error instanceof Error ? error.message : 'Paystack service failed.' }, 500, origin);
    }
  },
};
