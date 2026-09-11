import type { Config } from '@netlify/functions';

export default async (request: Request) => {
  if (request.method !== 'GET') return new Response('Method Not Allowed', { status: 405, headers: { allow: 'GET' } });
  return Response.json({ workspace: null, ready: true, message: 'Workspace API route is ready; authenticated Firestore persistence is the next backend integration.' });
};

export const config: Config = { path: '/api/workspace' };
