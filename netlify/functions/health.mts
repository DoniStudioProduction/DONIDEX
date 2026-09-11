import type { Config } from '@netlify/functions';

export default async () => Response.json({ ok: true, service: 'DONIDEX', migration: 'github-netlify', timestamp: new Date().toISOString() });

export const config: Config = { path: '/api/health' };
