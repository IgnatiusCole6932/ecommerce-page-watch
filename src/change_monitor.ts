import { createHash } from "node:crypto";
import { createEmbedding } from "./infrai_client.ts";

export type WatchInput = { url: string; previousBody?: string };
export type WatchResult = { changed: boolean; digest: string; previousDigest?: string; embedding?: number[]; message: string };

export function digest(body: string): string {
  return createHash("sha256").update(body).digest("hex");
}

export async function inspectPage(input: WatchInput, fetchPage: (url: string) => Promise<string> = fetchText, embedder: (body: string) => Promise<number[]> = createEmbedding): Promise<WatchResult> {
  const body = await fetchPage(input.url);
  const currentDigest = digest(body);
  const previousDigest = input.previousBody === undefined ? undefined : digest(input.previousBody);
  const changed = previousDigest !== undefined && currentDigest !== previousDigest;
  const embedding = await embedder(body.slice(0, 4000));
  return { changed, digest: currentDigest, previousDigest, embedding, message: changed ? `Change detected at ${input.url}` : `No change at ${input.url}` };
}

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url, { method: "GET" });
  if (!response.ok) throw new Error(`Page fetch failed: ${response.status}`);
  return response.text();
}
