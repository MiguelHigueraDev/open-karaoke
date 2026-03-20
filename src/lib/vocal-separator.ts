import type { SyncedLyrics, SyncMode } from '../types/lyrics';

export type ExportStatus =
  | 'idle'
  | 'uploading'
  | 'processing'
  | 'done'
  | 'error';

interface ExportOptions {
  lyrics: SyncedLyrics;
  syncMode: SyncMode;
  audioUrl: string;
  removeVocals?: boolean;
  onStatus?: (status: ExportStatus) => void;
  signal?: AbortSignal;
}

export async function exportVideoServer({
  lyrics,
  syncMode,
  audioUrl,
  removeVocals = false,
  onStatus,
  signal,
}: ExportOptions): Promise<Blob> {
  onStatus?.('uploading');

  // Fetch the audio blob from the blob/object URL
  const audioResponse = await fetch(audioUrl);
  const audioBlob = await audioResponse.blob();

  const formData = new FormData();
  formData.append('audio', audioBlob, 'audio.wav');
  formData.append('lyrics', JSON.stringify(lyrics));
  formData.append('syncMode', syncMode);
  formData.append('removeVocals', String(removeVocals));

  onStatus?.('processing');

  const response = await fetch('/api/export-video', {
    method: 'POST',
    body: formData,
    signal,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(
      (body as { error?: string }).error || `Export failed (${response.status})`,
    );
  }

  const blob = await response.blob();
  onStatus?.('done');
  return blob;
}
