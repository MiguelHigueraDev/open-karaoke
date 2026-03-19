import type { SyncedLine, SyncedWord } from '../types/lyrics';

const INSTRUMENTAL_RE = /^\[instrumental\]$/i;

export function parseLyrics(raw: string): SyncedLine[] {
  const lines = raw
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  return lines.map((line, lineIdx) => {
    const isInstrumental = INSTRUMENTAL_RE.test(line);

    const words = isInstrumental
      ? []
      : line.split(/\s+/).map(
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
      isInstrumental,
      startTime: null,
      endTime: null,
      words,
    };
  });
}
