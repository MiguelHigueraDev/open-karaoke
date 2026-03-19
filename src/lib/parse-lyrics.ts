import type { SyncedLine, SyncedWord } from '../types/lyrics';

export function parseLyrics(raw: string): SyncedLine[] {
  const lines = raw
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  return lines.map((line, lineIdx) => {
    const words = line.split(/\s+/).map(
      (text, wordIdx): SyncedWord => ({
        id: `l${lineIdx}w${wordIdx}`,
        text,
        startTime: null,
        endTime: null,
      }),
    );

    return {
      id: `l${lineIdx}`,
      index: lineIdx,
      startTime: null,
      endTime: null,
      words,
    };
  });
}
