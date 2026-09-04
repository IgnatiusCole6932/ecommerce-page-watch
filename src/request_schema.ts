export type WatchRequest = { url: string; previousBody?: string };

function parseWatchRequest(input: unknown): WatchRequest {
  if (typeof input !== "object" || input === null) {
    throw new Error("Invalid watch request");
  }
  const candidate = input as Record<string, unknown>;
  if (typeof candidate.url !== "string") {
    throw new Error("Invalid watch URL");
  }
  try {
    new URL(candidate.url);
  } catch {
    throw new Error("Invalid watch URL");
  }
  if (candidate.previousBody !== undefined && typeof candidate.previousBody !== "string") {
    throw new Error("Invalid previous body");
  }
  return { url: candidate.url, previousBody: candidate.previousBody as string | undefined };
}

export const watchRequest = { parse: parseWatchRequest };
