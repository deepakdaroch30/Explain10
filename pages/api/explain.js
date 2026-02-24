const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

function buildPrompt(topic, level, style) {
  return [
    'You are Explain10, an expert at simplifying complex topics.',
    `Audience level: ${level}.`,
    `Output style preference: ${style}.`,
    `Topic: ${topic}.`,
    'Return ONLY valid JSON with this exact shape:',
    '{"simpleExplanation":"...","analogy":"...","realWorldExample":"...","curiousQuestions":["...","...","..."]}',
    'Keep each section concise and high-readability.',
  ].join('\n');
}

function safeParseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Missing GEMINI_API_KEY in server environment.' });
  }

  const { topic, level = 'Kid', style = 'Simple' } = req.body ?? {};
  if (!topic || topic.trim().length < 3) {
    return res.status(400).json({ error: 'Please enter a topic with at least 3 characters.' });
  }

  try {
    const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildPrompt(topic.trim(), level, style) }] }],
        generationConfig: { temperature: 0.5, responseMimeType: 'application/json' },
      }),
    });

    if (!response.ok) {
      const details = await response.text();
      return res.status(502).json({ error: 'Gemini API request failed.', details });
    }

    const payload = await response.json();
    const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const parsed = safeParseJson(text);

    if (!parsed) {
      return res.status(502).json({ error: 'Gemini returned an unparsable response.' });
    }

    const output = {
      simpleExplanation: parsed.simpleExplanation || '',
      analogy: parsed.analogy || '',
      realWorldExample: parsed.realWorldExample || '',
      curiousQuestions: Array.isArray(parsed.curiousQuestions) ? parsed.curiousQuestions.slice(0, 5) : [],
    };

    return res.status(200).json(output);
  } catch (error) {
    return res.status(500).json({ error: 'Unexpected server error.', details: error.message });
  }
}
