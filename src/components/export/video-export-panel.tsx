import { useRef, useState } from 'react';
import { exportVideoServer, type ExportStatus } from '../../lib/vocal-separator';
import { VideoPreview } from './video-preview';
import type { SyncedLyrics, SyncMode } from '../../types/lyrics';

interface VideoExportPanelProps {
  lyrics: SyncedLyrics;
  syncMode: SyncMode;
  audioUrl: string;
}

export function VideoExportPanel({
  lyrics,
  syncMode,
  audioUrl,
}: VideoExportPanelProps) {
  const [exportStatus, setExportStatus] = useState<ExportStatus>('idle');
  const [exportError, setExportError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [removeVocals, setRemoveVocals] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const isBusy = exportStatus === 'uploading' || exportStatus === 'processing';

  const handleExportVideo = async () => {
    const abort = new AbortController();
    abortRef.current = abort;
    setExportError(null);

    try {
      const blob = await exportVideoServer({
        lyrics,
        syncMode,
        audioUrl,
        removeVocals,
        onStatus: setExportStatus,
        signal: abort.signal,
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${lyrics.metadata.title || 'lyrics'}-karaoke.mp4`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      const message = err instanceof Error ? err.message : 'Export failed';
      setExportError(message);
      setExportStatus('error');
      return;
    } finally {
      abortRef.current = null;
    }

    // Reset after a brief delay so user sees "done"
    setTimeout(() => setExportStatus('idle'), 2000);
  };

  const handleCancel = () => {
    abortRef.current?.abort();
    setExportStatus('idle');
  };

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold text-text-primary">
        Export as Video
      </h2>
      <p className="text-sm text-text-muted">
        Renders the karaoke animation with audio into an .mp4 video file.
        Processing happens on the server — you can switch tabs freely.
      </p>

      <label className="flex items-center gap-2 text-sm text-text-muted cursor-pointer select-none w-fit">
        <input
          type="checkbox"
          checked={removeVocals}
          onChange={(e) => setRemoveVocals(e.target.checked)}
          disabled={isBusy}
          className="accent-accent w-4 h-4 cursor-pointer"
        />
        Remove vocals (AI-powered, adds 1-2 min)
      </label>

      {showPreview && (
        <VideoPreview lyrics={lyrics} syncMode={syncMode} audioUrl={audioUrl} />
      )}

      {isBusy ? (
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-text-muted">
            {exportStatus === 'uploading'
              ? 'Uploading audio...'
              : removeVocals
                ? 'Removing vocals & rendering video...'
                : 'Rendering video...'}
          </span>
          <button
            className="px-3 py-1.5 border border-border rounded-lg bg-transparent text-text-muted text-xs cursor-pointer transition-all hover:bg-bg-elevated hover:border-red-500 hover:text-red-400"
            onClick={handleCancel}
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex gap-3">
            <button
              className="px-5 py-2.5 border border-border rounded-lg bg-transparent text-text-primary text-sm cursor-pointer transition-all hover:bg-bg-elevated hover:border-accent"
              onClick={() => setShowPreview((v) => !v)}
            >
              {showPreview ? 'Hide Preview' : 'Preview Video'}
            </button>
            <button
              className="px-5 py-2.5 border border-border rounded-lg bg-transparent text-text-primary text-sm cursor-pointer transition-all hover:bg-bg-elevated hover:border-accent"
              onClick={handleExportVideo}
            >
              Download .mp4
            </button>
          </div>
          {exportStatus === 'done' && (
            <span className="text-sm text-green-400">Export complete!</span>
          )}
          {exportStatus === 'error' && exportError && (
            <span className="text-sm text-red-400">{exportError}</span>
          )}
        </div>
      )}
    </div>
  );
}
