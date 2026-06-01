// Brazil 2026 quiz — live shared voting backend
// Cloudflare Worker + KV. Serves the static site (ASSETS) and a tiny /api.
//
// Routes:
//   POST /api/submit  {room, name, answers}  -> upserts this person's vote
//   GET  /api/results?room=ROOM              -> { room, people:[{name, ans}] }
// Everything else is served from the bound static assets (public/).

const TTL = 60 * 60 * 24 * 120; // votes expire after ~120 days

export default {
  async fetch(req, env) {
    const url = new URL(req.url);

    if (url.pathname === '/api/submit' && req.method === 'POST') {
      let body;
      try { body = await req.json(); } catch { return json({ error: 'bad json' }, 400); }
      const room = slug(body.room);
      const name = String(body.name || '').trim().slice(0, 30);
      if (!room || !name) return json({ error: 'room and name required' }, 400);
      const rec = { name, answers: body.answers || {}, ts: Date.now() };
      // key by person so re-finishing overwrites instead of duplicating
      await env.VOTES.put(`v:${room}:${slug(name)}`, JSON.stringify(rec), { expirationTtl: TTL });
      return json({ ok: true });
    }

    if (url.pathname === '/api/results' && req.method === 'GET') {
      const room = slug(url.searchParams.get('room') || '');
      if (!room) return json({ room: '', people: [] });
      const list = await env.VOTES.list({ prefix: `v:${room}:` });
      const people = [];
      for (const k of list.keys) {
        const val = await env.VOTES.get(k.name);
        if (!val) continue;
        try { const o = JSON.parse(val); people.push({ name: o.name, ans: o.answers }); } catch {}
      }
      people.sort((a, b) => a.name.localeCompare(b.name));
      return json({ room, people });
    }

    // static site
    return env.ASSETS.fetch(req);
  },
};

function slug(s) {
  return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 40);
}
function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}
