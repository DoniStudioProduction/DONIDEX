import type { Config } from '@netlify/functions';

export default async (request: Request) => {
  if (request.method !== 'GET') return new Response('Method Not Allowed', { status: 405, headers: { allow: 'GET' } });
  return Response.json({ businesses: [], message: 'Business storage is ready for authenticated Firestore integration.' });
};

export const config: Config = { path: '/api/businesses' };
