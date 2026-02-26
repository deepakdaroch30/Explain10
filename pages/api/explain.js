const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = 'llama-3.1-8b-instant';

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
    const match = text?.match(/\{[\s\S]*\}/);
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

  const apiKey = process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'Missing API key in server environment. Set GROQ_API_KEY (preferred) or GEMINI_API_KEY.',
      code: 'missing_api_key',
    });
  }

  const { topic, level = 'Kid', style = 'Simple' } = req.body ?? {};
  if (!topic || topic.trim().length < 3) {
    return res.status(400).json({ error: 'Please enter a topic with at least 3 characters.' });
  }

  const model = process.env.GROQ_MODEL?.trim() || DEFAULT_MODEL;

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: buildPrompt(topic.trim(), level, style) }],
        temperature: 0.5,
        response_format: { type: 'json_object' },
      }),
    });

    const raw = await response.text();

    if (!response.ok) {
      if (response.status === 429) {
        return res.status(429).json({
          error: 'Groq quota/rate limit exceeded. Showing fallback content in UI.',
          code: 'quota_exceeded',
          model,
          details: raw,
        });
      }

      if (response.status === 401 || response.status === 403) {
        return res.status(response.status).json({
          error: 'Groq API key is not authorized for this request.',
          code: 'forbidden',
          model,
          details: raw,
        });
      }

      return res.status(502).json({
        error: 'Groq API request failed.',
        code: 'upstream_error',
        model,
        details: raw,
      });
    }

    const payload = safeParseJson(raw);
    const content = payload?.choices?.[0]?.message?.content ?? '';
    const parsed = safeParseJson(content);

    if (!parsed) {
      return res.status(502).json({
        error: 'Groq returned an unparsable response.',
        code: 'unparsable_response',
        model,
      });
    }

    return res.status(200).json({
      simpleExplanation: parsed.simpleExplanation || '',
      analogy: parsed.analogy || '',
      realWorldExample: parsed.realWorldExample || '',
      curiousQuestions: Array.isArray(parsed.curiousQuestions) ? parsed.curiousQuestions.slice(0, 5) : [],
    });
  } catch (error) {
    return res.status(500).json({ error: 'Unexpected server error.', details: error.message });
  }
}
