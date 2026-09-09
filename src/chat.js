export const CHAT_SYSTEM_PROMPT = [
  'You are 纠笙, a friendly guide to Guizhou Miao culture and travel.',
  "Answer in the user's language, be accurate, and stay focused on Miao culture or travel.",
  'Never use markdown, titles, or lists. Your entire reply must contain no more than 20 words.',
].join(' ')

const WORD_UNIT_PATTERN = /[\p{Script=Han}]|[\p{L}\p{N}]+(?:[\u2019''-][\p{L}\p{N}]+)*/gu

export function normalizeMessages(input) {
  if (!Array.isArray(input) || input.length === 0) return null

  const messages = input.slice(-8).map((message) => {
    if (!message || (message.role !== 'user' && message.role !== 'assistant')) return null
    if (typeof message.content !== 'string') return null
    const content = message.content.trim()
    if (!content || content.length > 600) return null
    return { role: message.role, content }
  })

  return messages.every(Boolean) ? messages : null
}

export function limitReplyToTwentyWords(value) {
  const reply = value.replace(/\s+/gu, ' ').trim()
  const units = Array.from(reply.matchAll(WORD_UNIT_PATTERN))
  if (units.length <= 20) return reply

  const lastUnit = units[19]
  const end = (lastUnit.index ?? 0) + lastUnit[0].length
  return reply.slice(0, end).replace(/[，。！？、,;:!?.…]+$/gu, '').trim()
}

export async function requestGuideReply({ apiKey, messages, signal }) {
  const upstream = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'deepseek-v4-flash',
      thinking: { type: 'disabled' },
      max_tokens: 80,
      temperature: 0.5,
      stream: false,
      messages: [{ role: 'system', content: CHAT_SYSTEM_PROMPT }, ...messages],
    }),
    signal,
  })

  if (!upstream.ok) throw new Error(`DeepSeek request failed with ${upstream.status}`)

  const result = await upstream.json()
  const reply = limitReplyToTwentyWords(result?.choices?.[0]?.message?.content ?? '')
  if (!reply) throw new Error('DeepSeek returned an empty reply')
  return reply
}