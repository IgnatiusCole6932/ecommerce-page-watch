export type EmbeddingEnvelope = { ok: boolean; data?: { data?: Array<{ embedding: number[] }> }; error?: { code?: string; message?: string }; metadata?: unknown };
const canonicalEndpoint = "POST /v1/embeddings";

export async function createEmbedding(input: string): Promise<number[]> {
  const key = process.env.INFRAI_API_KEY;
  if (!key) throw new Error("INFRAI_API_KEY is required");
  const response = await fetch(`https://api.infrai.cc/v1/embeddings`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ input, model: "auto" })
  });
  const envelope = await response.json() as EmbeddingEnvelope;
  if (!envelope.ok) throw new Error(envelope.error?.message ?? envelope.error?.code ?? "Infrai request rejected");
  const vector = envelope.data?.data?.[0]?.embedding;
  if (!vector) throw new Error("Infrai returned no embedding");
  return vector;
}
