<<<<<<< HEAD
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
=======
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const maxChineseCharacters = (value: string) => {
  let count = 0
  let output = ''
  for (const character of value.trim()) {
    if (/^[\u3400-\u9fff]$/.test(character)) {
      if (count === 25) break
      count += 1
    }
    output += character
  }
  return output.trim()
>>>>>>> 9a5c53ba36c3dbf5088f1904f6fe2e4503bbb2e2
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
<<<<<<< HEAD
    plugins: [react(), localDeepSeekChat(env.DEEPSEEK_API_KEY)],
    server: { host: '127.0.0.1' },
  }
})
=======
    plugins: [react()],
    server: {
      host: '127.0.0.1',
      configureServer(server) {
      server.middlewares.use('/api/chat', async (request, response) => {
        if (request.method !== 'POST') { response.statusCode = 405; response.end(); return }
        const apiKey = env.DEEPSEEK_API_KEY
        if (!apiKey) { response.statusCode = 503; response.end(JSON.stringify({ error: 'DeepSeek API key is not configured.' })); return }
        let rawBody = ''
        for await (const chunk of request) rawBody += chunk
        try {
          const { messages } = JSON.parse(rawBody) as { messages?: Array<{ role: 'user' | 'assistant'; content: string }> }
          const history = Array.isArray(messages) ? messages.slice(-8) : []
          const upstream = await fetch('https://api.deepseek.com/chat/completions', {
            method: 'POST',
            headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: 'deepseek-v4-flash', thinking: { type: 'disabled' }, max_tokens: 40, messages: [{ role: 'system', content: '你是苗寨文化向导纠笙。用简体中文回答，亲切准确，只回答苗族文化或旅行相关内容。不超过25个汉字，不用标题。' }, ...history] }),
          })
          if (!upstream.ok) throw new Error(`DeepSeek returned ${upstream.status}`)
          const result = await upstream.json() as { choices?: Array<{ message?: { content?: string } }> }
          const reply = maxChineseCharacters(result.choices?.[0]?.message?.content ?? '')
          if (!reply) throw new Error('DeepSeek returned no text')
          response.setHeader('Content-Type', 'application/json')
          response.end(JSON.stringify({ reply }))
        } catch {
          response.statusCode = 502
          response.setHeader('Content-Type', 'application/json')
          response.end(JSON.stringify({ error: 'Unable to reach DeepSeek.' }))
        }
      })
      },
    },
  }
})
>>>>>>> 9a5c53ba36c3dbf5088f1904f6fe2e4503bbb2e2
