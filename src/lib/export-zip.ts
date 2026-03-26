import JSZip from 'jszip';
import type { SyncedLyrics, SyncMode } from '../types/lyrics';
import { exportToJson } from './export-json';

export async function exportToZip(
  lyrics: SyncedLyrics,
  syncMode: SyncMode,
  audioFile: File,
): Promise<Blob> {
  const zip = new JSZip();
  const json = exportToJson(lyrics, syncMode);

  zip.file('lyrics.json', json);
  zip.file(audioFile.name, audioFile);

  return zip.generateAsync({ type: 'blob' });
}

export interface ImportedZip {
  lyrics: SyncedLyrics;
  syncMode: SyncMode;
  audioFile: File;
}

export async function importFromZip(file: File): Promise<ImportedZip> {
  const zip = await JSZip.loadAsync(file);

  // Find lyrics.json
  const lyricsEntry = zip.file('lyrics.json');
  if (!lyricsEntry) {
    throw new Error('Missing lyrics.json in zip');
  }

  const jsonText = await lyricsEntry.async('string');
  const data = JSON.parse(jsonText);

  if (!data.lines || !Array.isArray(data.lines)) {
    throw new Error('Invalid format: missing "lines" array in lyrics.json');
  }

  const lyrics: SyncedLyrics = {
    metadata: {
      title: data.metadata?.title ?? '',
      artist: data.metadata?.artist ?? '',
      duration: data.metadata?.duration ?? 0,
    },
    lines: data.lines.map((l: Record<string, unknown>, i: number) => ({
      id: (l.id as string) ?? `l${i}`,
      index: i,
      isInstrumental: Boolean(l.isInstrumental),
      startTime: (l.startTime as number) ?? null,
      endTime: (l.endTime as number) ?? null,
      words: Array.isArray(l.words)
        ? (l.words as Record<string, unknown>[]).map((w, wi) => ({
            id: (w.id as string) ?? `l${i}w${wi}`,
            text: (w.text as string) ?? '',
            startTime: (w.startTime as number) ?? null,
            endTime: (w.endTime as number) ?? null,
          }))
        : [],
    })),
  };

  const syncMode: SyncMode =
    data.metadata?.syncMode === 'line' ? 'line' : 'word';

  // Find audio file (any file that isn't lyrics.json)
  const audioEntry = Object.values(zip.files).find(
    (f) => !f.dir && f.name !== 'lyrics.json',
  );
  if (!audioEntry) {
    throw new Error('Missing audio file in zip');
  }

  const audioBlob = await audioEntry.async('blob');
  const audioFile = new File([audioBlob], audioEntry.name, {
    type: guessAudioMime(audioEntry.name),
  });

  return { lyrics, syncMode, audioFile };
}

function guessAudioMime(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase();
  const map: Record<string, string> = {
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    ogg: 'audio/ogg',
    m4a: 'audio/mp4',
    webm: 'audio/webm',
    flac: 'audio/flac',
  };
  return map[ext ?? ''] ?? 'audio/mpeg';
}
