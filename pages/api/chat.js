// -------------------- /pages/api/chat.js --------------------
// For Next.js pages router: create this file at /pages/api/chat.js
// This is a simple proxy that calls OpenAI's Chat Completions endpoint.

/*
Example Save as: /pages/api/chat.js
*/

// Node/Next server code (CommonJS or ESM depending on your setup)

/* eslint-disable import/no-anonymous-default-export */

export default async function handler(req, res) {
  const clientKey = req.headers["x-access-token"];
  if (clientKey !== process.env.MY_ACCESS_TOKEN) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_API_KEY) return res.status(500).json({ error: 'Missing OPENAI_API_KEY on server' });

  const body = req.body;
  const messages = body.messages ?? [{ role: 'user', content: body.prompt ?? 'Hello' }];

  try {
    const openai_model = req.headers["x-openai-model"];
    if (openai_model == null) {
      openai_model = process.env.OPENAI_MODEL;
    } 
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: openai_model,
        messages: messages.map((m) => ({ role: m.role, content: m.text ?? m.content })),
        max_tokens: 800,
        temperature: 0.7,
      }),
    });

    if (!r.ok) {
      const text = await r.text();
      console.error('OpenAI error', text);
      return res.status(500).json({ error: 'OpenAI error', details: text });
    }

    const data = await r.json();
    const assistant = data.choices?.[0]?.message?.content ?? data.choices?.[0]?.text ?? '';
    res.status(200).json({ text: assistant });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error', details: String(err) });
  }
}

// -------------------- .env.local --------------------
// OPENAI_API_KEY=sk-REPLACE_WITH_YOUR_KEY

// -------------------- 설치 및 실행 가이드 --------------------
/*
1) Next.js 프로젝트 생성 (if you don't have one):
   npx create-next-app@latest my-chat-app
   cd my-chat-app

2) Tailwind 설치 (선택): follow Next.js + Tailwind docs, or skip and adjust styles.

3) 파일 추가:
   - Replace /app/page.jsx or /pages/index.jsx with frontend code above
   - Create /pages/api/chat.js with server code above

4) 환경 변수 설정:
   - Create .env.local in project root with OPENAI_API_KEY=sk-...

5) Start dev server:
   npm install
   npm run dev

6) Visit http://localhost:3000 and test

주의: 절대 OpenAI 키를 클라이언트 코드에 넣지 마세요. 서버에서만 보관하세요.
*/
