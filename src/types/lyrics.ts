export interface SyncedWord {
  id: string;
  text: string;
  /** Milliseconds */
  startTime: number | null;
  /** Milliseconds */
  endTime: number | null;
}

export interface SyncedLine {
  id: string;
  index: number;
  isInstrumental: boolean;
  /** True when the line was inserted during line-sync, not from the original lyrics text. */
  insertedDuringSync?: boolean;
  /** Milliseconds */
  startTime: number | null;
  /** Milliseconds */
  endTime: number | null;
  words: SyncedWord[];
}

export type SyncMode = 'line' | 'word';

export interface Metadata {
  title: string;
  artist: string;
  /** Milliseconds */
  duration: number;
}

export interface SyncedLyrics {
  metadata: Metadata;
  lines: SyncedLine[];
}
