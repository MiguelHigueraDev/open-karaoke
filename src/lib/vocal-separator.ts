export type SeparationStatus =
  | 'idle'
  | 'uploading'
  | 'processing'
  | 'done'
  | 'error';

interface SeparateOptions {
  audioUrl: string;
  onStatus?: (status: SeparationStatus) => void;
  signal?: AbortSignal;
}

export async function separateVocals({
  audioUrl,
  onStatus,
  signal,
}: SeparateOptions): Promise<string> {
  onStatus?.('uploading');

  // Fetch the audio blob from the blob/object URL
  const audioResponse = await fetch(audioUrl);
  const audioBlob = await audioResponse.blob();

  const formData = new FormData();
  formData.append('audio', audioBlob, 'audio.wav');

  onStatus?.('processing');

  const response = await fetch('/api/separate', {
    method: 'POST',
    body: formData,
    signal,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(
      (body as { error?: string }).error || `Separation failed (${response.status})`,
    );
  }

  const instrumentalBlob = await response.blob();
  const instrumentalUrl = URL.createObjectURL(instrumentalBlob);

  onStatus?.('done');
  return instrumentalUrl;
}
