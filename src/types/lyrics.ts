export interface SyncedWord {
  id: string;
  text: string;
  startTime: number | null;
  endTime: number | null;
}

export interface SyncedLine {
  id: string;
  index: number;
  startTime: number | null;
  endTime: number | null;
  words: SyncedWord[];
}

export interface Metadata {
  title: string;
  artist: string;
  duration: number; // seconds
}

export interface SyncedLyrics {
  metadata: Metadata;
  lines: SyncedLine[];
}
