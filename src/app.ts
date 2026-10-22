import { greetingResponse } from './features/greeting/greeting';
import { welcomeResponse } from './features/welcome/welcome';

// Routing is explicit so a contributor can find every public endpoint here.
export function handleRequest(request: Request, env: Env): Response {
  const url = new URL(request.url);
  if (!['/', '/api/health', '/api/greeting'].includes(url.pathname)) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return Response.json(
      { error: 'Method not allowed' },
      { status: 405, headers: { Allow: 'GET, HEAD' } },
    );
  }

  let response: Response;
  switch (url.pathname) {
    case '/':
      response = welcomeResponse(env.APP_NAME);
      break;
    case '/api/health':
      response = Response.json({ status: 'ok' });
      break;
    default:
      response = greetingResponse(url.searchParams.get('name'));
  }
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Cache-Control', 'no-store');
  return request.method === 'HEAD'
    ? new Response(null, { status: response.status, headers: response.headers })
    : response;
}
