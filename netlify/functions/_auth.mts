type VerifiedIdentity = { uid: string; email: string };

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function requireFirebaseIdentity(request: Request): Promise<VerifiedIdentity | Response> {
  const header = request.headers.get('authorization') || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  const token = match?.[1]?.trim() || '';
  const apiKey = process.env.FIREBASE_WEB_API_KEY || process.env.VITE_FIREBASE_API_KEY || '';
  if (!token || !apiKey) return Response.json({ error: 'Authenticated billing access is not configured.' }, { status: 503 });

  try {
    const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: token }),
    });
    const data = await response.json().catch(() => null);
    const account = Array.isArray(data?.users) ? data.users[0] : null;
    const email = String(account?.email || '').trim().toLowerCase();
    const uid = String(account?.localId || '').trim();
    if (!response.ok || !uid || !emailPattern.test(email)) return Response.json({ error: 'Authentication required.' }, { status: 401 });
    return { uid, email };
  } catch {
    return Response.json({ error: 'Authentication service is temporarily unavailable.' }, { status: 503 });
  }
}

export function isIdentityResponse(value: VerifiedIdentity | Response): value is Response {
  return value instanceof Response;
}
