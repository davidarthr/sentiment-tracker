'use client'
import { useState } from 'react'

export default function Home() {
  const [topic, setTopic] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  async function analyze() {
    setLoading(true)
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic })
    })
    const data = await res.json()
    setResult(data)
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8">
      <h1 className="text-3xl font-bold mb-8">Sentiment Tracker</h1>
      
      <div className="w-full max-w-lg flex gap-3 mb-8">
        <input
          className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-white outline-none"
          placeholder="Enter a topic..."
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        />
        <button
          onClick={analyze}
          className="bg-white text-black px-6 py-3 rounded-lg font-semibold hover:bg-zinc-200"
        >
          {loading ? 'Analyzing...' : 'Analyze'}
        </button>
      </div>

      {result && (
        <div className="w-full max-w-lg bg-zinc-900 border border-zinc-700 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">{result.topic}</h2>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              result.sentiment === 'positive' ? 'bg-green-900 text-green-300' :
              result.sentiment === 'negative' ? 'bg-red-900 text-red-300' :
              'bg-yellow-900 text-yellow-300'
            }`}>
              {result.sentiment}
            </span>
          </div>
          <p className="text-zinc-300 mb-4">{result.summary}</p>
          <div>
            <p className="text-zinc-500 text-sm mb-2">Key Themes</p>
            <div className="flex flex-wrap gap-2">
              {result.key_themes.map((theme, i) => (
                <span key={i} className="bg-zinc-800 px-3 py-1 rounded-full text-sm">{theme}</span>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  )
}