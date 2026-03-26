import { useCallback, useRef, useState } from "react";
import { useAppState, useDispatch } from "../../state/lyrics-context";
import { useAudio } from "../../hooks/use-audio";
import { KaraokeRenderer } from "../preview/karaoke-renderer";
import { PlaybackControls } from "../shared/playback-controls";
import { VideoExportPanel } from "../export/video-export-panel";
import { MAX_DURATION_MS } from "../../../shared/constants";
import { importFromZip } from "../../lib/export-zip";

export function PlayerScreen() {
  const { lyrics, syncMode, audioUrl, audioFile } = useAppState();
  const dispatch = useDispatch();
  const zipInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [zipLoading, setZipLoading] = useState(false);

  const isReady = lyrics.lines.length > 0 && audioUrl !== null;

  const audio = useAudio({
    url: audioUrl,
    container: containerRef,
  });

  const handleZipFile = useCallback(
    async (file: File) => {
      setError(null);
      setZipLoading(true);
      try {
        const { lyrics: loaded, syncMode: mode, audioFile: audio } =
          await importFromZip(file);

        const url = URL.createObjectURL(audio);
        const el = new Audio(url);
        await new Promise<void>((resolve, reject) => {
          el.addEventListener("loadedmetadata", () => {
            const durationMs = el.duration * 1000;
            if (durationMs > MAX_DURATION_MS) {
              URL.revokeObjectURL(url);
              reject(
                new Error(
                  `Song exceeds the ${MAX_DURATION_MS / 60_000}-minute limit`,
                ),
              );
              return;
            }
            dispatch({ type: "SET_AUDIO", file: audio, url, duration: durationMs });
            resolve();
          });
          el.addEventListener("error", () =>
            reject(new Error("Could not load audio from zip")),
          );
        });

        dispatch({
          type: "LOAD_SYNCED_LYRICS",
          lyrics: loaded,
          syncMode: mode,
        });
        setZipFile(file);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Could not load zip file",
        );
      } finally {
        setZipLoading(false);
      }
    },
    [dispatch],
  );

  return (
    <div className="flex flex-col h-screen max-w-[1400px] mx-auto px-4 md:px-8">
      <header className="flex items-center justify-between py-4 pb-3 border-b border-border">
        <h1 className="text-xl font-bold tracking-tight text-text-primary">
          Player
        </h1>
        <button
          className="px-4 py-2 text-xs border border-border rounded-lg bg-bg-surface text-text-primary cursor-pointer transition-all hover:bg-bg-elevated hover:border-accent"
          onClick={() => dispatch({ type: "SET_APP_MODE", mode: "home" })}
        >
          Back to Home
        </button>
      </header>

      <main className="flex-1 overflow-y-auto py-6">
        <div className="flex flex-col gap-5">
          {/* Zip upload */}
          <div
            className={`flex items-center justify-center min-h-[100px] border-2 border-dashed rounded-lg cursor-pointer transition-all bg-bg-surface ${
              zipFile && audioFile
                ? "border-success border-solid"
                : "border-border hover:border-accent hover:bg-accent/5"
            }`}
            onClick={() => zipInputRef.current?.click()}
          >
            <input
              ref={zipInputRef}
              type="file"
              accept=".zip"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleZipFile(file);
              }}
            />
            {zipLoading ? (
              <div className="flex flex-col items-center gap-1 text-text-muted text-sm">
                <span className="text-xl">⏳</span>
                <span>Loading zip...</span>
              </div>
            ) : zipFile && audioFile ? (
              <div className="flex flex-col items-center gap-1 text-success text-sm">
                <span className="font-mono text-[13px]">{zipFile.name}</span>
                <span className="text-[11px] text-text-dim">
                  {lyrics.lines.length} lines + audio loaded · Click to change
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1 text-text-muted text-sm">
                <span className="text-xl">📦</span>
                <span>Load karaoke .zip (lyrics + audio)</span>
              </div>
            )}
          </div>

          <p className="text-[11px] leading-relaxed text-text-dim text-center">
            Only upload content you have the rights to use. Uploaded media is
            processed on our server but is not stored permanently.
          </p>

          {error && <p className="text-sm text-red-400">{error}</p>}

          {/* Song info */}
          {isReady && (lyrics.metadata.title || lyrics.metadata.artist) && (
            <div className="text-center text-sm text-text-muted">
              {lyrics.metadata.title}
              {lyrics.metadata.artist && ` — ${lyrics.metadata.artist}`}
            </div>
          )}

          {/* Player */}
          {isReady ? (
            <>
              <div
                ref={containerRef}
                className="bg-bg-surface rounded-lg p-2 border border-border"
              />
              <PlaybackControls
                isPlaying={audio.isPlaying}
                isReady={audio.isReady}
                currentTime={audio.currentTime}
                duration={audio.duration}
                onPlayFromStart={() => {
                  if (!audio.isPlaying) {
                    audio.seekTo(0);
                    audio.play();
                  } else {
                    audio.pause();
                  }
                }}
                onTogglePlay={audio.togglePlay}
                onSeek={audio.seekTo}
              />

              <KaraokeRenderer
                lyrics={lyrics}
                syncMode={syncMode}
                getCurrentTime={audio.getCurrentTime}
                isPlaying={audio.isPlaying}
                controls={
                  <PlaybackControls
                    isPlaying={audio.isPlaying}
                    isReady={audio.isReady}
                    currentTime={audio.currentTime}
                    duration={audio.duration}
                    onPlayFromStart={() => {
                      if (!audio.isPlaying) {
                        audio.seekTo(0);
                        audio.play();
                      } else {
                        audio.pause();
                      }
                    }}
                    onTogglePlay={audio.togglePlay}
                    onSeek={audio.seekTo}
                  />
                }
              />

              <div className="mt-4 border-t border-border pt-4">
                <VideoExportPanel
                  lyrics={lyrics}
                  syncMode={syncMode}
                  audioUrl={audioUrl}
                />
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center min-h-[300px] bg-bg-surface rounded-lg text-text-dim text-sm">
              Load a karaoke .zip to start
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
