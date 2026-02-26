import Head from 'next/head';
import { useMemo, useState } from 'react';

const EXAMPLES = ['Explain blockchain', 'Explain APIs', 'Explain inflation'];

const STYLE_TEMPLATES = {
  Simple: {
    analogyPrefix: 'Think of it like',
    questionPrompt: 'Want to learn even more?',
  },
  Analogy: {
    analogyPrefix: 'Imagine',
    questionPrompt: 'If this analogy makes sense, ask:',
  },
  'Step-by-step': {
    analogyPrefix: 'A step-by-step way to picture it is',
    questionPrompt: 'To go step-by-step, you could ask:',
  },
};

function buildExplanation(topic, level, style) {
  const tone =
    level === 'Kid'
      ? 'super simple with playful words'
      : level === 'Expert'
      ? 'clear but with more technical precision'
      : 'simple, friendly, and practical';

  const template = STYLE_TEMPLATES[style] ?? STYLE_TEMPLATES.Simple;

  return {
    simpleExplanation: `${topic} works in a way that's ${tone}. The big idea is that smaller parts work together to create a useful result. Once you understand each part's job, the whole thing becomes much easier to follow.`,
    analogy: `${template.analogyPrefix} a team delivering pizzas: one person takes orders, one cooks, one drives. ${topic} is similar because different parts each have a role, and the final outcome only works when they coordinate.`,
    realWorldExample: `In real life, ${topic} shows up when apps or systems need to handle many steps quickly and clearly—like booking a ride, tracking a package, or streaming video smoothly.`,
    curiousQuestions: [
      `What is the most important part of ${topic}?`,
      `What breaks if one part of ${topic} fails?`,
      `${template.questionPrompt}`,
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

  const placeholder = useMemo(() => EXAMPLES[Math.floor(Math.random() * EXAMPLES.length)], []);

  const runExplain = async (overrideTopic, overrideLevel = level) => {
    const currentTopic = (overrideTopic ?? topic).trim();
    setError('');
    setResult(null);

    if (currentTopic.length < 3) {
      setError('Please enter a topic with at least 3 characters.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: currentTopic, level: overrideLevel, style }),
      });

      const payload = await response.json();
      if (!response.ok) {
        if (payload?.code === 'quota_exceeded') {
          setError('Gemini quota exceeded. Showing a local fallback explanation for now.');
          setResult(buildExplanation(currentTopic, overrideLevel, style));
          return;
        }

        if (payload?.code === 'forbidden') {
          throw new Error('Gemini key is not authorized. Check GEMINI_API_KEY and project access.');
        }

        throw new Error(payload?.error || 'Failed to explain this topic.');
      }

      setResult(payload);
    } catch (err) {
      setError(err.message || 'Failed to explain this topic.');
      setResult(buildExplanation(currentTopic, overrideLevel, style));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Explain10 - Understand anything, instantly</title>
      </Head>

      <div className="hero-backdrop" aria-hidden="true" />

      <header className="app-header">
        <div className="header-content">
          <div className="brand">
            <div className="brand-icon">✨</div>
            <span className="brand-text">Explain10</span>
          </div>
          <nav className="header-nav">
            <button className="ghost-btn" type="button">Examples</button>
            <button className="ghost-btn" type="button" disabled>
              History
            </button>
            <button className="ghost-btn" type="button">Login</button>
          </nav>
        </div>
      </header>

      <main className="app-main">
        <section className="hero">
          <h1>
            Understand <span className="gradient-word">anything</span>, instantly
          </h1>
          <p>Turn complex ideas into simple, clear explanations.</p>
        </section>

        <section className="input-card card">
          <div className="example-chips">
            {EXAMPLES.map((example) => (
              <button key={example} className="chip" type="button" onClick={() => setTopic(example)}>
                {example}
              </button>
            ))}
          </div>

          <textarea
            id="topicInput"
            rows={6}
            placeholder={placeholder}
            aria-label="Concept to explain"
            className={topic.trim() ? 'has-content' : ''}
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />

          <div className="controls-grid">
            <div className="field-group">
              <span>Explanation Level</span>
              <div className="segmented-control" role="radiogroup" aria-label="Explanation level">
                {['Kid', 'Teen', 'Expert'].map((item) => (
                  <button
                    key={item}
                    type="button"
                    data-level={item}
                    className={`segment-pill ${level === item ? 'is-active' : ''}`}
                    onClick={() => setLevel(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div className="field-group">
              <span>Output Style</span>
              <div className="toggle-group" role="radiogroup" aria-label="Output style">
                {['Simple', 'Analogy', 'Step-by-step'].map((item) => (
                  <button
                    key={item}
                    type="button"
                    data-style={item}
                    className={`toggle-pill ${style === item ? 'is-active' : ''}`}
                    onClick={() => setStyle(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="cta-row">
            <button id="explainBtn" className="primary-btn" type="button" onClick={() => runExplain()} disabled={loading}>
              Explain Simply
            </button>
          </div>
        </section>

        <div className="flow-connector" aria-hidden="true">↓</div>

        {error ? (
          <section className="error-alert" role="alert">
            {error}
          </section>
        ) : null}

        {loading ? (
          <section className="loading-card card" aria-live="polite">
            <p>Generating...</p>
            <div className="skeleton-line w-90" />
            <div className="skeleton-line w-75" />
            <div className="skeleton-line w-100" />
            <div className="skeleton-line w-65" />
          </section>
        ) : null}

        {result ? (
          <section id="outputSection" className="output-card card" aria-live="polite">
            <div className="output-block output-explanation">
              <h2>
                <span>📘</span> <span>Simple Explanation</span>
              </h2>
              <p>{result.simpleExplanation}</p>
            </div>

            <div className="output-block output-analogy">
              <h2>
                <span>💡</span> <span>Analogy</span>
              </h2>
              <p>{result.analogy}</p>
            </div>

            <div className="output-block output-example">
              <h2>
                <span>🌍</span> <span>Real-world Example</span>
              </h2>
              <p>{result.realWorldExample}</p>
            </div>

            <div className="output-block output-questions">
              <h2>
                <span>❓</span> <span>Curious Questions</span>
              </h2>
              <ul className="question-list">
                {result.curiousQuestions.map((question) => (
                  <li key={question}>
                    <button className="question-chip" type="button" onClick={() => runExplain(question)}>
                      <span>{question}</span>
                      <span aria-hidden="true">›</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="action-bar">
              <button className="small-pill" type="button">
                📋 Copy
              </button>
              <button className="small-pill" type="button" onClick={() => { setLevel('Kid'); runExplain(topic, 'Kid'); }}>
                🔽 Simplify More
              </button>
              <button className="small-pill" type="button" onClick={() => { setLevel('Expert'); runExplain(topic, 'Expert'); }}>
                🔍 Explain Deeper
              </button>
            </div>
          </section>
        ) : null}
      </main>
    </>
  );
}
