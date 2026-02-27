import Head from 'next/head';
import Script from 'next/script';
import { useMemo, useState } from 'react';

const EXAMPLES = ['Explain blockchain', 'Explain APIs', 'Explain inflation'];

function buildExplanation(topic, level, style) {
  const tone =
    level === 'Kid'
      ? 'super simple with playful words'
      : level === 'Expert'
      ? 'clear but with more technical precision'
      : 'simple, friendly, and practical';

  const styleAddOn =
    style === 'Analogy'
      ? 'Focus on relatable comparisons.'
      : style === 'Step-by-step'
      ? 'Break the flow into clear steps.'
      : 'Keep it straightforward and concise.';

  return {
    simpleExplanation: `${topic} works in a way that's ${tone}. ${styleAddOn} The core idea is that smaller parts coordinate to produce a useful outcome.`,
    analogy: `${topic} is like a pizza team: one person takes orders, one cooks, and one delivers. Each role matters for the final result.`,
    stepByStep: [
      `Define the goal of ${topic}.`,
      `Break ${topic} into small moving parts.`,
      `Follow how each part contributes to the final result.`,
    ],
    realWorldExample: `You can see ${topic} in everyday systems like booking rides, tracking parcels, or streaming a video smoothly.`,
    curiousQuestions: [
      `What is the most important part of ${topic}?`,
      `What breaks if one part fails?`,
      `How would ${topic} change at 10x scale?`,
    ],
  };
}

export default function Home() {
  const [topic, setTopic] = useState('');
  const [level, setLevel] = useState('Kid');
  const [style, setStyle] = useState('Simple');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [followupAnswer, setFollowupAnswer] = useState(null);
  const [followupLoading, setFollowupLoading] = useState(false);
  const [expanded, setExpanded] = useState({ example: false, analogy: false, questions: false });

  const placeholder = useMemo(() => EXAMPLES[Math.floor(Math.random() * EXAMPLES.length)], []);

  const runExplain = async (overrideTopic, overrideLevel = level, overrideStyle = style) => {
    const currentTopic = (overrideTopic ?? topic).trim();
    setError('');
    setResult(null);
    setFollowupAnswer(null);

    if (currentTopic.length < 3) {
      setError('Please enter a topic with at least 3 characters.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: currentTopic, level: overrideLevel, style: overrideStyle }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to explain this topic.');
      }

      setResult(payload);
      setExpanded({ example: false, analogy: false, questions: false });
    } catch (err) {
      setError(err.message || 'Failed to explain this topic.');
      setResult(buildExplanation(currentTopic, overrideLevel, overrideStyle));
    } finally {
      setLoading(false);
    }
  };

  const answerCuriousQuestion = async (question) => {
    setFollowupLoading(true);
    try {
      const response = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: question, level, style: 'Simple' }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error();
      setFollowupAnswer({ question, answer: payload.simpleExplanation || '' });
    } catch {
      setFollowupAnswer({ question, answer: buildExplanation(question, level, 'Simple').simpleExplanation });
    } finally {
      setFollowupLoading(false);
    }
  };

  const toggle = (key) => setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <>
      <Head>
        <title>Explain10 - Understand anything, instantly</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Script src="https://cdn.tailwindcss.com" strategy="beforeInteractive" />

      <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 text-slate-900">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/85 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-indigo-600 text-white">✨</div>
              <span className="text-4 font-semibold">Explain10</span>
            </div>
            <nav className="flex items-center gap-6 text-sm text-gray-500">
              <a className="transition hover:text-gray-900" href="#">Examples</a>
              <a className="transition hover:text-gray-900" href="#">History</a>
              <a className="transition hover:text-gray-900" href="#">Login</a>
            </nav>
          </div>
        </header>

        <main className="mx-auto grid max-w-4xl gap-5 px-4 pb-28 pt-6 md:pb-10 md:pt-8">
          <section className="text-center">
            <h1 className="text-4xl font-semibold tracking-tight text-slate-900 md:text-6xl">
              Understand <span className="text-indigo-600">anything</span>, instantly
            </h1>
            <p className="mt-3 text-lg text-gray-500">Turn complex ideas into simple, clear explanations.</p>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
            <div className="mb-3 flex flex-wrap gap-2">
              {EXAMPLES.map((example) => (
                <button
                  key={example}
                  className="rounded-full bg-gray-100 px-3 py-1.5 text-sm text-gray-700 transition hover:bg-gray-200"
                  type="button"
                  onClick={() => setTopic(example)}
                >
                  {example}
                </button>
              ))}
            </div>

            <textarea
              id="topicInput"
              rows={4}
              placeholder={placeholder}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="mb-4 w-full rounded-xl border border-gray-300 p-4 text-slate-900 outline-none ring-indigo-500/40 transition focus:border-indigo-500 focus:ring-2"
            />

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="mb-2 text-sm text-gray-500">Explanation Level</p>
                <div className="flex flex-wrap gap-2">
                  {['Kid', 'Teen', 'Expert'].map((item) => (
                    <button
                      key={item}
                      onClick={() => setLevel(item)}
                      className={`rounded-full px-4 py-1.5 text-sm transition ${
                        level === item ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                      type="button"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm text-gray-500">Output Style</p>
                <div className="flex flex-wrap gap-2">
                  {['Simple', 'Analogy', 'Step-by-step'].map((item) => (
                    <button
                      key={item}
                      onClick={() => setStyle(item)}
                      className={`rounded-full px-4 py-1.5 text-sm transition ${
                        style === item ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                      type="button"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-center">
              <button
                id="explainBtn"
                type="button"
                disabled={loading}
                onClick={() => runExplain()}
                className="rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white shadow hover:bg-indigo-700 disabled:opacity-70"
              >
                {loading ? 'Explaining…' : 'Explain Simply'}
              </button>
            </div>

            {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
          </section>

          {result ? (
            <section className="grid gap-3 md:grid-cols-2">
              <article className="rounded-xl bg-blue-50 p-4 md:col-span-2">
                <h2 className="mb-2 text-base font-semibold text-slate-900">📘 Simple Explanation</h2>
                <p className="text-sm text-slate-700">{result.simpleExplanation}</p>
              </article>

              <article className="rounded-xl bg-green-50 p-4">
                <button className="mb-2 flex w-full items-center justify-between md:cursor-default" type="button" onClick={() => toggle('example')}>
                  <h3 className="text-base font-semibold">🌍 Real-world Example</h3>
                  <span className="text-gray-500 md:hidden">{expanded.example ? '−' : '+'}</span>
                </button>
                <p className={`${expanded.example ? 'block' : 'hidden'} text-sm text-slate-700 md:block`}>{result.realWorldExample}</p>
              </article>

              <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <button className="mb-2 flex w-full items-center justify-between md:cursor-default" type="button" onClick={() => toggle('analogy')}>
                  <h3 className="text-base font-semibold">💡 Analogy</h3>
                  <span className="text-gray-500 md:hidden">{expanded.analogy ? '−' : '+'}</span>
                </button>
                <div className={`${expanded.analogy ? 'block' : 'hidden'} md:block`}>
                  {style === 'Step-by-step' ? (
                    <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-700">
                      {(result.stepByStep || []).map((step, idx) => (
                        <li key={`${step}-${idx}`}>{step}</li>
                      ))}
                    </ol>
                  ) : (
                    <p className="text-sm text-slate-700">{style === 'Analogy' ? result.analogy : result.analogy}</p>
                  )}
                </div>
              </article>

              <article className="rounded-xl bg-yellow-50 p-4 md:col-span-2">
                <button className="mb-2 flex w-full items-center justify-between md:cursor-default" type="button" onClick={() => toggle('questions')}>
                  <h3 className="text-base font-semibold">❓ Curious Questions</h3>
                  <span className="text-gray-500 md:hidden">{expanded.questions ? '−' : '+'}</span>
                </button>
                <ul className={`${expanded.questions ? 'grid' : 'hidden'} gap-2 md:grid`}>
                  {result.curiousQuestions.map((question) => (
                    <li key={question}>
                      <button
                        className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm text-slate-700 hover:border-indigo-300"
                        type="button"
                        onClick={() => answerCuriousQuestion(question)}
                      >
                        <span>{question}</span>
                        <span>›</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </article>

              {followupLoading ? <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm md:col-span-2">Answering your question…</div> : null}
              {followupAnswer ? (
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 md:col-span-2">
                  <h4 className="mb-1 text-sm font-semibold">Answer to: {followupAnswer.question}</h4>
                  <p className="text-sm text-slate-700">{followupAnswer.answer}</p>
                </div>
              ) : null}
            </section>
          ) : null}
        </main>

        {result ? (
          <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 p-3 backdrop-blur md:static md:border-0 md:bg-transparent md:p-0">
            <div className="mx-auto flex max-w-4xl flex-wrap justify-end gap-2">
              <button
                className="rounded-full bg-gray-100 px-3 py-2 text-sm text-gray-700 hover:bg-gray-200"
                type="button"
                onClick={() => navigator.clipboard.writeText(result.simpleExplanation || '')}
              >
                Copy
              </button>
              <button
                className="rounded-full bg-gray-100 px-3 py-2 text-sm text-gray-700 hover:bg-gray-200"
                type="button"
                onClick={() => {
                  setLevel('Kid');
                  runExplain(topic, 'Kid', style);
                }}
              >
                Simplify More
              </button>
              <button
                className="rounded-full bg-gray-100 px-3 py-2 text-sm text-gray-700 hover:bg-gray-200"
                type="button"
                onClick={() => {
                  setLevel('Expert');
                  runExplain(topic, 'Expert', style);
                }}
              >
                Explain Deeper
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}
