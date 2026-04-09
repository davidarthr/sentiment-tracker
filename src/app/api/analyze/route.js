import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

const SUBREDDITS = [
  'GenZ',
  'decadeology', 
  'popculturechat',
  'redscarepod',
  'unpopularopinion',
  'BlackPeopleTwitter',
]

async function fetchRedditPosts(topic) {
  const results = []
  
  for (const subreddit of SUBREDDITS) {
    try {
      const res = await fetch(
        `https://www.reddit.com/r/${subreddit}/search.json?q=${encodeURIComponent(topic)}&sort=new&limit=5&restrict_sr=1`,
        { headers: { 'User-Agent': 'sentiment-tracker/1.0' } }
      )
      const data = await res.json()
      const posts = data?.data?.children?.map(p => ({
        subreddit: p.data.subreddit,
        title: p.data.title,
        text: p.data.selftext?.slice(0, 300),
        score: p.data.score,
        comments: p.data.num_comments,
      })) || []
      results.push(...posts)
    } catch (e) {
      console.error(`Failed to fetch r/${subreddit}:`, e)
    }
  }
  
  return results
}

export async function POST(request) {
  const { topic } = await request.json()

  const posts = await fetchRedditPosts(topic)
  
  const postsContext = posts.length > 0
    ? posts.map(p => `[r/${p.subreddit}] "${p.title}" ${p.text ? '— ' + p.text : ''} (${p.score} upvotes, ${p.comments} comments)`).join('\n\n')
    : 'No Reddit posts found for this topic.'

  const message = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `You are a Gen Z cultural analyst. Analyze sentiment around this topic: "${topic}"

Here are real Reddit posts from Gen Z and culture communities:

${postsContext}

Return a JSON object with these fields:
- topic: the topic name
- sentiment: "positive", "negative", or "mixed"
- summary: 2-3 sentence summary grounded in the actual posts
- key_themes: array of 3 key themes from the posts
- post_count: number of posts analyzed

Return only valid JSON, no markdown.`
      }
    ]
  })

  try {
    const text = message.content[0].text.replace(/```json|```/g, '').trim()
    const result = JSON.parse(text)
    return Response.json(result)
  } catch (e) {
    console.error('Claude response:', message.content[0].text)
    return Response.json({ error: 'Failed to parse response' }, { status: 500 })
  }
}
