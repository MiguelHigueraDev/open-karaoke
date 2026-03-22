import { useRef, useState } from "react";
import {
  exportVideoServer,
  type ExportProgress,
} from "../../lib/vocal-separator";
import { VideoPreview } from "./video-preview";
import type { SyncedLyrics, SyncMode } from "../../types/lyrics";

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
  const [progress, setProgress] = useState<ExportProgress>({
    stage: "idle",
    progress: 0,
    message: "",
  });
  const [exportError, setExportError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [removeVocals, setRemoveVocals] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const isBusy =
    progress.stage === "uploading" ||
    progress.stage === "vocal-removal" ||
    progress.stage === "encoding";

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
        onProgress: setProgress,
        signal: abort.signal,
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${lyrics.metadata.title || "lyrics"}-karaoke.mp4`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      const message = err instanceof Error ? err.message : "Export failed";
      setExportError(message);
      setProgress({ stage: "error", progress: 0, message });
      return;
    } finally {
      abortRef.current = null;
    }

    // Reset after a brief delay so user sees "done"
    setTimeout(
      () => setProgress({ stage: "idle", progress: 0, message: "" }),
      2000,
    );
  };

  const handleCancel = () => {
    abortRef.current?.abort();
    setProgress({ stage: "idle", progress: 0, message: "" });
  };

  const stageLabel =
    progress.stage === "uploading"
      ? "Uploading audio..."
      : progress.stage === "vocal-removal"
        ? "Removing vocals..."
        : progress.stage === "encoding"
          ? "Encoding video..."
          : progress.message;

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold text-text-primary">
        Export as Video
      </h2>
      <p className="text-sm text-text-muted">
        Renders the karaoke animation with audio into an .mp4 video file.
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
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin shrink-0" />
            <span className="text-sm text-text-muted">{stageLabel}</span>
            <button
              className="ml-auto px-3 py-1.5 border border-border rounded-lg bg-transparent text-text-muted text-xs cursor-pointer transition-all hover:bg-bg-elevated hover:border-red-500 hover:text-red-400"
              onClick={handleCancel}
            >
              Cancel
            </button>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2 bg-bg-elevated rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress.progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-text-muted">
            <span>
              {progress.stage === "vocal-removal" && "Step 1/2"}
              {progress.stage === "encoding" && removeVocals && "Step 2/2"}
              {progress.stage === "encoding" && !removeVocals && ""}
              {progress.stage === "uploading" && ""}
            </span>
            <span>{progress.progress}%</span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex gap-3">
            <button
              className="px-5 py-2.5 border border-border rounded-lg bg-transparent text-text-primary text-sm cursor-pointer transition-all hover:bg-bg-elevated hover:border-accent"
              onClick={() => setShowPreview((v) => !v)}
            >
              {showPreview ? "Hide Preview" : "Preview Video"}
            </button>
            <button
              className="px-5 py-2.5 border border-border rounded-lg bg-transparent text-text-primary text-sm cursor-pointer transition-all hover:bg-bg-elevated hover:border-accent"
              onClick={handleExportVideo}
            >
              Download .mp4
            </button>
          </div>
          {progress.stage === "done" && (
            <span className="text-sm text-green-400">Export complete!</span>
          )}
          {progress.stage === "error" && exportError && (
            <span className="text-sm text-red-400">{exportError}</span>
          )}
        </div>
      )}
    </div>
  );
}
