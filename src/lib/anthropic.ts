// Shared Anthropic API helper — replaces OpenAI calls across the codebase

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

export async function callClaude(
  messages: { role: 'user' | 'assistant'; content: string }[],
  opts?: { maxTokens?: number; temperature?: number; system?: string }
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');

  const res = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: opts?.maxTokens || 1500,
      ...(opts?.system ? { system: opts.system } : {}),
      messages,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Anthropic API error (${res.status})`);
  }

  const data = await res.json();
  return (data.content || []).filter((b: any) => b.type === 'text').map((b: any) => b.text).join('');
}
