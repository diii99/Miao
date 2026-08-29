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
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
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
