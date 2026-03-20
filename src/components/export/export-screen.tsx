import { useRef, useState } from 'react';
import { StepShell } from '../layout/step-shell';
import { useAppState } from '../../state/lyrics-context';
import { exportToJson } from '../../lib/export-json';
import { exportToVideo } from '../../lib/export-video';
import { VideoPreview } from './video-preview';

export function ExportScreen() {
  const { lyrics, syncMode, audioUrl } = useAppState();
  const [copied, setCopied] = useState(false);
  const [videoProgress, setVideoProgress] = useState<number | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const json = exportToJson(lyrics, syncMode);

  const isExporting = videoProgress !== null;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${lyrics.metadata.title || 'lyrics'}-synced.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportVideo = async () => {
    if (!audioUrl) return;

    const abort = new AbortController();
    abortRef.current = abort;
    setVideoProgress(0);

    try {
      const blob = await exportToVideo({
        lyrics,
        syncMode,
        audioUrl,
        onProgress: setVideoProgress,
        signal: abort.signal,
      });

      // Trigger download
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

  const handleCancelExport = () => {
    abortRef.current?.abort();
  };

  return (
    <StepShell>
      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-text-primary">
          Synced Lyrics JSON
        </h2>
        <div className="flex gap-3">
          <button
            className="px-5 py-2.5 border border-accent rounded-lg bg-accent text-white text-sm font-semibold cursor-pointer transition-all hover:bg-accent-glow hover:border-accent-glow"
            onClick={handleCopy}
          >
            {copied ? 'Copied!' : 'Copy to Clipboard'}
          </button>
          <button
            className="px-5 py-2.5 border border-border rounded-lg bg-transparent text-text-primary text-sm cursor-pointer transition-all hover:bg-bg-elevated hover:border-accent"
            onClick={handleDownload}
          >
            Download .json
          </button>
        </div>

        {audioUrl && (
          <div className="flex flex-col gap-3 mt-2">
            <h2 className="text-lg font-semibold text-text-primary">
              Export as Video
            </h2>
            <p className="text-sm text-text-muted">
              Renders the karaoke animation with audio into a .webm video file.
              This plays through the song in real-time.
            </p>

            {showPreview && (
              <VideoPreview
                lyrics={lyrics}
                syncMode={syncMode}
                audioUrl={audioUrl}
              />
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
                  onClick={handleCancelExport}
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
        )}

        <pre className="bg-bg-surface border border-border rounded-lg p-5 font-mono text-xs leading-relaxed text-text-muted overflow-auto max-h-[500px]">
          {json}
        </pre>
      </div>
    </StepShell>
  );
}
