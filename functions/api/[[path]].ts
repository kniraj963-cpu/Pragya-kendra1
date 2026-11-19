interface Env {
  API_ORIGIN?: string;
}

interface PagesContext {
  request: Request;
  env: Env;
  params: {
    path?: string | string[];
  };
}

export async function onRequest(context: PagesContext): Promise<Response> {
  const origin = (context.env.API_ORIGIN || '').replace(/\/$/, '');
  if (!origin) {
    return new Response(
      JSON.stringify({
        ok: false,
        error:
          'Cloudflare API_ORIGIN is not configured. Set API_ORIGIN in Cloudflare Pages -> Settings -> Environment Variables to your Express + MongoDB backend URL.',
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  const incomingUrl = new URL(context.request.url);
  const pathSegments = Array.isArray(context.params.path)
    ? context.params.path.join('/')
    : context.params.path || '';
  const targetUrl = `${origin}/api/${pathSegments}${incomingUrl.search}`;

  const headers = new Headers(context.request.headers);
  headers.delete('host');

  const init: RequestInit = {
    method: context.request.method,
    headers,
    redirect: 'manual',
  };

  if (!['GET', 'HEAD'].includes(context.request.method.toUpperCase())) {
    init.body = context.request.body;
  }

  try {
    const upstream = await fetch(targetUrl, init);
    const respHeaders = new Headers(upstream.headers);
    respHeaders.set('X-Proxied-By', 'cloudflare-pages-functions');
    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: respHeaders,
    });
  } catch (err) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: `Upstream MongoDB API unreachable: ${(err as Error).message}`,
      }),
      {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
