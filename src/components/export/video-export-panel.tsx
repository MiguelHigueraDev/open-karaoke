import { useRef, useState } from 'react';
import { exportToVideo } from '../../lib/export-video';
import { separateVocals, type SeparationStatus } from '../../lib/vocal-separator';
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
  const [videoProgress, setVideoProgress] = useState<number | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [removeVocals, setRemoveVocals] = useState(false);
  const [separationStatus, setSeparationStatus] =
    useState<SeparationStatus>('idle');
  const [separationError, setSeparationError] = useState<string | null>(null);
  const [instrumentalUrl, setInstrumentalUrl] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const isExporting = videoProgress !== null;
  const isSeparating =
    separationStatus === 'uploading' || separationStatus === 'processing';

  const handleSeparateVocals = async () => {
    const abort = new AbortController();
    abortRef.current = abort;
    setSeparationError(null);

    try {
      const url = await separateVocals({
        audioUrl,
        onStatus: setSeparationStatus,
        signal: abort.signal,
      });
      setInstrumentalUrl(url);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setSeparationError(
        err instanceof Error ? err.message : 'Separation failed',
      );
      setSeparationStatus('error');
    } finally {
      abortRef.current = null;
    }
  };

  const handleExportVideo = async () => {
    const exportAudioUrl =
      removeVocals && instrumentalUrl ? instrumentalUrl : audioUrl;

    const abort = new AbortController();
    abortRef.current = abort;
    setVideoProgress(0);

    try {
      const blob = await exportToVideo({
        lyrics,
        syncMode,
        audioUrl: exportAudioUrl,
        onProgress: setVideoProgress,
        signal: abort.signal,
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${lyrics.metadata.title || 'lyrics'}-karaoke.webm`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        // User cancelled
      } else {
        console.error('Video export failed:', err);
      }
    } finally {
      setVideoProgress(null);
      abortRef.current = null;
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold text-text-primary">
        Export as Video
      </h2>
      <p className="text-sm text-text-muted">
        Renders the karaoke animation with audio into a .webm video file. This
        plays through the song in real-time.
      </p>

      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2 text-sm text-text-muted cursor-pointer select-none w-fit">
          <input
            type="checkbox"
            checked={removeVocals}
            onChange={(e) => {
              setRemoveVocals(e.target.checked);
              if (!e.target.checked) {
                setSeparationStatus('idle');
                setSeparationError(null);
              }
            }}
            disabled={isExporting || isSeparating}
            className="accent-accent w-4 h-4 cursor-pointer"
          />
          Remove vocals (AI-powered, requires server)
        </label>

        {removeVocals && (
          <div className="flex items-center gap-3 ml-6">
            {separationStatus === 'idle' && !instrumentalUrl && (
              <button
                className="px-4 py-2 border border-border rounded-lg bg-transparent text-text-primary text-sm cursor-pointer transition-all hover:bg-bg-elevated hover:border-accent"
                onClick={handleSeparateVocals}
                disabled={isExporting}
              >
                Separate Vocals
              </button>
            )}
            {isSeparating && (
              <>
                <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-text-muted">
                  {separationStatus === 'uploading'
                    ? 'Uploading audio...'
                    : 'Removing vocals (this may take 1-2 minutes)...'}
                </span>
                <button
                  className="px-3 py-1.5 border border-border rounded-lg bg-transparent text-text-muted text-xs cursor-pointer transition-all hover:bg-bg-elevated hover:border-red-500 hover:text-red-400"
                  onClick={() => abortRef.current?.abort()}
                >
                  Cancel
                </button>
              </>
            )}
            {separationStatus === 'done' && instrumentalUrl && (
              <span className="text-sm text-green-400">
                Vocals removed — ready to export
              </span>
            )}
            {separationStatus === 'error' && separationError && (
              <span className="text-sm text-red-400">{separationError}</span>
            )}
          </div>
        )}
      </div>

      {showPreview && (
        <VideoPreview lyrics={lyrics} syncMode={syncMode} audioUrl={audioUrl} />
      )}

      {isExporting ? (
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 bg-bg-surface rounded-full overflow-hidden border border-border">
            <div
              className="h-full bg-accent transition-[width] duration-300 rounded-full"
              style={{ width: `${Math.round(videoProgress * 100)}%` }}
            />
          </div>
          <span className="text-sm text-text-muted tabular-nums min-w-[3ch]">
            {Math.round(videoProgress * 100)}%
          </span>
          <button
            className="px-3 py-1.5 border border-border rounded-lg bg-transparent text-text-muted text-xs cursor-pointer transition-all hover:bg-bg-elevated hover:border-red-500 hover:text-red-400"
            onClick={() => abortRef.current?.abort()}
          >
            Cancel
          </button>
        </div>
      ) : (
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
            Download .webm
          </button>
        </div>
      )}
    </div>
  );
}
