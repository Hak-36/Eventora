export async function askAgent(input: string, sessionId?: string) {
  const id = process.env.AGENT37_INSTANCE_ID;
  const key = process.env.AGENT37_API_KEY;
  if (!id || !key) throw new Error('Agent37 is not configured');

  const res = await fetch(`https://${id}.agent37.app/v1/responses`, {
    method: 'POST',
    headers: { 'X-Agent37-Key': key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ input, session_id: sessionId }),
  });
  if (!res.ok) throw new Error(`Agent37 request failed (${res.status})`);

  const data = await res.json();
  if (data.status === 'failed') throw new Error(data.error?.message ?? 'Agent turn failed');
  return { reply: (data.output_text ?? '') as string, sessionId: data.session_id as string };
}
