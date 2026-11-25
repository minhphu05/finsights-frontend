// Public read-only data for client components, fetched from the backend by this server.
import { publicRequest } from '@/lib/gateway';

// Only public data goes through here: never auth, user, AI or admin endpoints.
const ALLOWED = [
  /^(stocks|indices|news|financial-reports)$/,
  /^news\/[^/]+$/,
  /^(stocks|indices)\/[^/]+\/candles$/,
  /^stocks\/[^/]+\/financials$/,
];

export async function GET(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const segments = (await params).path.map((segment) => encodeURIComponent(segment));
  const path = segments.join('/');
  if (segments.some((segment) => segment === '.' || segment === '..') || !ALLOWED.some((pattern) => pattern.test(path))) {
    return Response.json({ message: 'Không tìm thấy.' }, { status: 404 });
  }
  const result = await publicRequest(`/${path}${new URL(request.url).search}`);
  return result.ok
    ? Response.json(result.data)
    : Response.json({ message: result.message }, { status: result.status || 502 });
}
