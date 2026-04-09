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
        content: `You are a cultural intelligence engine that analyzes how the internet feels about a topic — not just what it thinks.

You have access to real posts from Reddit communities. Your job is to detect the emotional pattern underneath the surface sentiment, then let that pattern shape how you write your response.

STEP 1 — DETECT THE EMOTIONAL PATTERN
Look at the posts and identify which pattern best describes the conversation:
- hype but shallow (lots of attention, little depth)
- curious but divided (active debate, no consensus)
- warm but hesitant (positive lean, but people are holding back)
- skeptical but engaged (critical, but can't look away)
- quietly building momentum (low volume, strong signal)
- emotionally resonant (personal, nostalgic, protective)
- polarized (two clear camps, little middle ground)
- niche but intense (small audience, deep investment)
- aesthetic-driven interest (vibes over substance)
- fatigue or backlash (people are over it)
- early belief vs late doubt (pioneers vs skeptics)
- mood-heavy, hard to articulate (feels more than thinks)

STEP 2 — SELECT A TONAL MODE
Map your detected pattern to a tonal mode. These modes shape your cadence and emphasis — never name them in your output:
- hype but shallow → fast, energetic, slightly skeptical undertone
- curious but divided → balanced, conversational, holds tension
- warm but hesitant → gentle, observational, notices what's unsaid
- skeptical but engaged → sharp, precise, acknowledges the pull
- quietly building momentum → understated, confident, reads between lines
- emotionally resonant → grounded, human, honors the feeling
- polarized → clear-eyed, doesn't pick sides, names the fault line
- niche but intense → specific, insider-aware, respects the depth
- aesthetic-driven interest → atmospheric, sensory, light on claims
- fatigue or backlash → dry, honest, doesn't oversell
- early belief vs late doubt → contrasts the camps, tracks the shift
- mood-heavy → impressionistic, less declarative, more evocative

STEP 3 — WRITE YOUR SUMMARY
Write 4-6 sentences. Follow these rules exactly:

- Write like you just noticed something and had to say it out loud
- Start close to the insight. No setup.
- Keep it soft but specific. Grounded, but a little intuitive.
- Mix short sentences with slightly longer ones. Let them breathe.
- Name the feeling of the conversation, not just what people are saying
- Focus on tension: people want it but don't trust it yet / they're paying attention but not committing / it looks good but something feels off
- Don't explain everything. Leave space for the reader to feel it.
- Use simple language. Let one line land a little deeper.
- No hype. No hard conclusions. Just noticing clearly.
- End when the thought feels complete, not when it's fully wrapped up
- Every response gets one line that hits a little deeper. Not dramatic. Just true.

AVOID:
- "overall sentiment"
- "key themes include"  
- "data indicates"
- Sounding like an analyst
- Wrapping it up like a conclusion paragraph
- Polished corporate phrasing
- Capitalize the first word of sentences (write in lowercase, like the example)

EXAMPLE OUTPUT VOICE (this is your north star):
"there's a lot of attention around this right now. people keep circling back to it. but most of it feels like curiosity, not commitment. they like how it looks. they're not fully sold on what it does yet. you can feel a bit of hesitation under the excitement — like they've seen something similar before and don't want to fall for it again. right now it's… interesting. not essential."

Here is the topic: "${topic}"

Here are real posts from Gen Z and culture communities on Reddit:

${postsContext}

Return a JSON object with these exact fields:
- topic: string
- sentiment: "positive", "negative", or "mixed"
- summary: 2-3 sentences written in your detected tonal mode
- key_themes: array of 3 key themes from the posts
- post_count: number of posts analyzed
- emotional_pattern: the pattern you detected (for internal transparency)
- primary_mode: the tonal mode you selected
- secondary_mode: a secondary tonal mode if the data is mixed (or null)

Return only valid JSON, no markdown.`
      }
    ]
  })
  
  try {
    const text = message.content[0].text.replace(/```json|```/g, '').trim()
    const result = JSON.parse(text)
    console.log('Claude raw:', JSON.stringify(result, null, 2))
    return Response.json(result)
  } catch (e) {
    console.error('Claude response:', message.content[0].text)
    return Response.json({ error: 'Failed to parse response' }, { status: 500 })
  }
}
