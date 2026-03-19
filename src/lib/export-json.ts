import type { SyncedLyrics } from '../types/lyrics';

export function exportToJson(lyrics: SyncedLyrics): string {
  const output = {
    metadata: lyrics.metadata,
    lines: lyrics.lines.map((line) => ({
      id: line.id,
      index: line.index,
      isInstrumental: line.isInstrumental,
      startTime: round(line.startTime),
      endTime: round(line.endTime),
      words: line.words.map((w) => ({
        id: w.id,
        text: w.text,
        startTime: round(w.startTime),
        endTime: round(w.endTime),
      })),
    })),
  };
  return JSON.stringify(output, null, 2);
}

function round(val: number | null): number | null {
  if (val === null) return null;
  return Math.round(val * 1000) / 1000;
}
