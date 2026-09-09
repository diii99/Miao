import { normalizeMessages, requestGuideReply } from './chat.js'

const MODEL_KEY_PATTERN = /^MiaoGirl_[1-6]\.glb$/
const MAX_CHAT_BODY_BYTES = 16 * 1024

async function serveModel(request, env) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET, HEAD' } })
  }

  const url = new URL(request.url)
  const key = decodeURIComponent(url.pathname.slice('/models/'.length))
  if (!MODEL_KEY_PATTERN.test(key)) return new Response('Not Found', { status: 404 })

  const object = await env.MODELS.get(key)
  if (!object) return new Response('Not Found', { status: 404 })

  const headers = new Headers()
  object.writeHttpMetadata(headers)
  headers.set('Content-Type', headers.get('Content-Type') || 'model/gltf-binary')
  headers.set('ETag', object.httpEtag)
  headers.set('Cache-Control', 'public, max-age=31536000, immutable')
  return new Response(request.method === 'HEAD' ? null : object.body, { headers })
}

export default {
  async fetch(request, env) {
    const pathname = new URL(request.url).pathname
    if (pathname.startsWith('/models/')) return serveModel(request, env)

    if (pathname === '/api/chat') {
      if (request.method !== 'POST') {
        return Response.json({ error: 'Method not allowed.' }, { status: 405, headers: { Allow: 'POST' } })
      }

      if (!env.DEEPSEEK_API_KEY) {
        return Response.json({ error: 'The cultural guide is not configured.' }, { status: 503 })
      }

      const contentLength = Number(request.headers.get('content-length') ?? 0)
      if (contentLength > MAX_CHAT_BODY_BYTES) {
        return Response.json({ error: 'Request is too large.' }, { status: 413 })
      }

      let input
      try {
        const rawBody = await request.text()
        if (rawBody.length > MAX_CHAT_BODY_BYTES) {
          return Response.json({ error: 'Request is too large.' }, { status: 413 })
        }
        input = JSON.parse(rawBody)
      } catch {
        return Response.json({ error: 'Invalid chat request.' }, { status: 400 })
      }

      const messages = normalizeMessages(input?.messages)
      if (!messages) return Response.json({ error: 'Invalid chat messages.' }, { status: 400 })

      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 20_000)
      try {
        const reply = await requestGuideReply({
          apiKey: env.DEEPSEEK_API_KEY,
          messages,
          signal: controller.signal,
        })
        return Response.json({ reply })
      } catch (error) {
        console.error('DeepSeek chat request failed', { message: error instanceof Error ? error.message : 'unknown' })
        return Response.json({ error: 'The cultural guide is temporarily unavailable.' }, { status: 502 })
      } finally {
        clearTimeout(timeout)
      }
    }

    return env.ASSETS.fetch(request)
  },
}