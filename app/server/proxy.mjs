// Standalone Google Sheets CSV proxy (production / non-Vite use).
//
//   node server/proxy.mjs           # listens on :8787
//   PROXY_PORT=9000 node server/proxy.mjs
//
// Frontend calls:  /gsheet?url=<encoded gviz csv url>
// The proxy fetches server-side (no browser CORS) and streams the CSV back
// with an permissive CORS header. Zero dependencies (Node 18+ global fetch).

import { createServer } from 'node:http'

const PORT = Number(process.env.PROXY_PORT) || 8787
const ALLOWED_HOST = 'docs.google.com'

const server = createServer(async (req, res) => {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
  if (req.method === 'OPTIONS') {
    res.writeHead(204, cors)
    res.end()
    return
  }

  const u = new URL(req.url, `http://localhost:${PORT}`)
  if (u.pathname !== '/gsheet') {
    res.writeHead(404, cors)
    res.end('Not found')
    return
  }

  const target = u.searchParams.get('url')
  if (!target) {
    res.writeHead(400, cors)
    res.end('Missing ?url=')
    return
  }

  let parsed
  try {
    parsed = new URL(target)
  } catch {
    res.writeHead(400, cors)
    res.end('Invalid url')
    return
  }
  // Only allow Google Sheets hosts.
  if (parsed.hostname !== ALLOWED_HOST) {
    res.writeHead(403, cors)
    res.end('Host not allowed')
    return
  }

  try {
    const upstream = await fetch(parsed.toString(), { redirect: 'follow' })
    const body = await upstream.text()
    res.writeHead(upstream.status, {
      ...cors,
      'Content-Type': 'text/csv; charset=utf-8',
    })
    res.end(body)
  } catch (err) {
    res.writeHead(502, cors)
    res.end('Upstream fetch failed: ' + (err?.message || 'unknown'))
  }
})

server.listen(PORT, () => {
  console.log(`[gsheet-proxy] listening on http://localhost:${PORT}/gsheet?url=<encoded-csv-url>`)
})
