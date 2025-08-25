export function splitLines(lyrics: string, size = 20) {
  const lines = lyrics.split("\n").map(s => s.trim()).filter(Boolean);
  const chunks: string[][] = [];
  for (let i = 0; i < lines.length; i += size) chunks.push(lines.slice(i, i + size));
  return chunks;
}

export async function withRetry<T>(fn: () => Promise<T>, max = 2) {
  let lastErr: any;
  for (let i = 0; i <= max; i++) {
    try { return await fn(); }
    catch (e:any) { lastErr = e; await new Promise(r => setTimeout(r, 600 * (i + 1))); }
  }
  throw lastErr;
}
