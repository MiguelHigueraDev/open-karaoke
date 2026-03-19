export interface SyncedWord {
  id: string;
  text: string;
  startTime: number | null;
  endTime: number | null;
}

export interface SyncedLine {
  id: string;
  index: number;
  isInstrumental: boolean;
  /** True when the line was inserted during line-sync, not from the original lyrics text. */
  insertedDuringSync?: boolean;
  startTime: number | null;
  endTime: number | null;
  words: SyncedWord[];
}

export type SyncMode = 'line' | 'word';

export interface Metadata {
  title: string;
  artist: string;
  duration: number; // seconds
}

export interface SyncedLyrics {
  metadata: Metadata;
  lines: SyncedLine[];
}
