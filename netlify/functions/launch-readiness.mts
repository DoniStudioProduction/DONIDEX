import type { Config } from '@netlify/functions';
import { isIdentityResponse, requireFirebaseIdentity } from './_auth.mts';

const OWNER_EMAIL = 'donistudioproduction@gmail.com';

export default async (request: Request) => {
  if (request.method !== 'GET') return new Response('Method Not Allowed', { status: 405, headers: { allow: 'GET' } });
  const identity = await requireFirebaseIdentity(request);
  if (isIdentityResponse(identity)) return identity;
  if (identity.email !== OWNER_EMAIL) return Response.json({ error: 'Originator access required.' }, { status: 403 });

  return Response.json({
    ok: true,
    checkedAt: new Date().toISOString(),
    release: {
      codeCi: 'required-and-enforced',
      productionDeploy: 'blocked until Netlify production credits resume',
      livePayment: 'requires controlled real-world Paystack test',
      liveAuth: 'requires controlled real-world Firebase provider test',
      pwa: 'ready for browser/device installation test',
      playStore: 'listing URL intentionally not hard-coded until official listing exists',
    },
    smokeSuite: [
      'registration and email verification',
      'email/password login, logout, password reset',
      'Google and Apple authentication',
      'profile and workspace persistence',
      'Free/Premium/Business entitlement paths',
      'Paystack checkout, verification and webhook',
      'billing portal and recovery controls',
      'team roles and secure document sharing',
      'mobile layout and PWA install/share',
    ],
  });
};

export const config: Config = { path: '/api/launch-readiness' };
