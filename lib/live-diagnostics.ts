// Local, bounded diagnostic metadata only. Never accept audio, SDP, keys or transcripts.
const fields = new Set(['phase','code','event','context','connection','ice','channel','track','enabled','muted','packets','bytes','level','status','ms']);
const entries: { at: string; event: string; details: Record<string, string | number | boolean> }[] = [];
export async function liveDiagnostics(request: Request) {
  const url = new URL(request.url);
  if (!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) return new Response(null, { status: 403 });
  if (request.method === 'GET') return Response.json(entries, { headers: { 'Cache-Control': 'no-store' } });
  if (request.method !== 'POST' || request.headers.get('origin') !== url.origin) return new Response(null, { status: 403 });
  const raw = await request.text();
  if (raw.length > 2048) return new Response(null, { status: 413 });
  try {
    const body = JSON.parse(raw);
    if (typeof body.event !== 'string' || !/^[a-z_.-]{1,64}$/.test(body.event)) return new Response(null, { status: 400 });
    const details: Record<string, string | number | boolean> = {};
    for (const [key, value] of Object.entries(body.details || {})) {
      if (!fields.has(key)) continue;
      if (typeof value === 'number' && Number.isFinite(value) || typeof value === 'boolean') details[key] = value;
      else if (typeof value === 'string' && /^[a-zA-Z0-9_.-]{1,80}$/.test(value)) details[key] = value;
    }
    const entry = { at: new Date().toISOString(), event: body.event, details };
    entries.push(entry); if (entries.length > 150) entries.shift();
    console.info('[navi-live]', JSON.stringify(entry));
    return new Response(null, { status: 204 });
  } catch { return new Response(null, { status: 400 }); }
}
