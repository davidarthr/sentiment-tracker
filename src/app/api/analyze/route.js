import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

export async function POST(request) {
  const { topic } = await request.json()

  const message = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `Analyze the current sentiment around this topic: "${topic}". Return a JSON object with these fields: topic (string), sentiment ("positive", "negative", or "mixed"), summary (2-3 sentence summary), key_themes (array of 3 strings). Return only valid JSON, no markdown.`
      }
    ]
  })

  const result = JSON.parse(message.content[0].text)
  return Response.json(result)
}
