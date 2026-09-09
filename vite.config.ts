import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { normalizeMessages, requestGuideReply } from './src/chat.js'

const MAX_CHAT_BODY_BYTES = 16 * 1024

function localDeepSeekChat(apiKey: string | undefined): Plugin {
  return {
    name: 'local-deepseek-chat',
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        if (request.url?.split('?')[0] !== '/api/chat') {
          next()
          return
        }
        if (request.method !== 'POST') {
          response.statusCode = 405
          response.setHeader('Allow', 'POST')
          response.end(JSON.stringify({ error: 'Method not allowed.' }))
          return
        }
        if (!apiKey) {
          response.statusCode = 503
          response.end(JSON.stringify({ error: 'The cultural guide is not configured.' }))
          return
        }
        if (Number(request.headers['content-length'] ?? 0) > MAX_CHAT_BODY_BYTES) {
          response.statusCode = 413
          response.end(JSON.stringify({ error: 'Request is too large.' }))
          return
        }

        let rawBody = ''
        for await (const chunk of request) {
          rawBody += chunk
          if (rawBody.length > MAX_CHAT_BODY_BYTES) {
            response.statusCode = 413
            response.end(JSON.stringify({ error: 'Request is too large.' }))
            return
          }
        }

        let messages
        try {
          messages = normalizeMessages(JSON.parse(rawBody).messages)
        } catch {
          response.statusCode = 400
          response.end(JSON.stringify({ error: 'Invalid chat request.' }))
          return
        }
        if (!messages) {
          response.statusCode = 400
          response.end(JSON.stringify({ error: 'Invalid chat messages.' }))
          return
        }

        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 20_000)
        try {
          const reply = await requestGuideReply({ apiKey, messages, signal: controller.signal })
          response.setHeader('Content-Type', 'application/json')
          response.end(JSON.stringify({ reply }))
        } catch {
          response.statusCode = 502
          response.setHeader('Content-Type', 'application/json')
          response.end(JSON.stringify({ error: 'The cultural guide is temporarily unavailable.' }))
        } finally {
          clearTimeout(timeout)
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), localDeepSeekChat(env.DEEPSEEK_API_KEY)],
    server: { host: '127.0.0.1' },
  }
})