const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

const DEFAULT_MODELS = [
  'gemini-1.5-flash-latest',
  'gemini-1.5-flash',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
];

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

function resolveModelCandidates() {
  const configured = process.env.GEMINI_MODEL?.trim();
  if (configured) {
    return [configured, ...DEFAULT_MODELS.filter((model) => model !== configured)];
  }
  return DEFAULT_MODELS;
}

async function requestGemini({ apiKey, model, topic, level, style }) {
  const response = await fetch(`${GEMINI_API_BASE}/${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: buildPrompt(topic, level, style) }] }],
      generationConfig: { temperature: 0.5, responseMimeType: 'application/json' },
    }),
  });

  const raw = await response.text();
  const data = safeParseJson(raw);
  return { ok: response.ok, status: response.status, raw, data };
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

  const modelCandidates = resolveModelCandidates();
  let lastError = null;

  try {
    for (const model of modelCandidates) {
      const result = await requestGemini({
        apiKey,
        model,
        topic: topic.trim(),
        level,
        style,
      });

      if (result.ok) {
        const text = result.data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
        const parsed = safeParseJson(text);

        if (!parsed) {
          lastError = {
            model,
            status: 502,
            error: 'Gemini returned an unparsable response.',
          };
          continue;
        }

        const output = {
          simpleExplanation: parsed.simpleExplanation || '',
          analogy: parsed.analogy || '',
          realWorldExample: parsed.realWorldExample || '',
          curiousQuestions: Array.isArray(parsed.curiousQuestions) ? parsed.curiousQuestions.slice(0, 5) : [],
        };

        return res.status(200).json(output);
      }

      // Retry with next model when current model isn't available.
      if (result.status === 404) {
        lastError = {
          model,
          status: result.status,
          error: 'Model not found for this API key/version. Trying fallback model.',
          details: result.raw,
        };
        continue;
      }

      // For non-404 errors, stop early and surface error details.
      return res.status(502).json({
        error: 'Gemini API request failed.',
        model,
        details: result.raw,
      });
    }

    return res.status(502).json({
      error: 'Gemini API request failed for all configured models.',
      attemptedModels: modelCandidates,
      lastError,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Unexpected server error.', details: error.message });
  }
}
