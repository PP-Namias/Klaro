import 'dotenv/config';

const model = process.env.LLM_MODEL || 'gemini-1.5-pro';
const key = process.env.LLM_API_KEY;

if (!key) {
  console.error('LLM_API_KEY not set in .env');
  process.exit(1);
}

const systemPrompt = 'You are a helpful assistant.';
const prompt = 'Say hello in Filipino and ask one follow-up question.';

const body = {
  contents: [
    {
      parts: [{ text: systemPrompt }, { text: prompt }],
    },
  ],
  generationConfig: {
    temperature: 0.7,
    maxOutputTokens: 300,
  },
};

const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

try {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    console.error('Gemini API error', res.status, await res.text());
    process.exit(2);
  }

  const data = await res.json();
  console.log('API response:', JSON.stringify(data, null, 2));
  const candidate = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  console.log('\nModel output:\n', candidate || '<no output>');
} catch (err) {
  console.error('Request failed:', err);
  process.exit(3);
}
