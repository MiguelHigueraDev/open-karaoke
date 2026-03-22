import { useCallback, useRef, useState } from "react";
import { useAppState, useDispatch } from "../../state/lyrics-context";
import { useAudio } from "../../hooks/use-audio";
import { KaraokeRenderer } from "../preview/karaoke-renderer";
import { PlaybackControls } from "../shared/playback-controls";
import { VideoExportPanel } from "../export/video-export-panel";
import type { SyncedLyrics, SyncMode } from "../../types/lyrics";

const AUDIO_ACCEPT = [
  "audio/mpeg",
  "audio/wav",
  "audio/ogg",
  "audio/mp4",
  "audio/webm",
  "audio/flac",
];

export function PlayerScreen() {
  const { lyrics, syncMode, audioUrl, audioFile } = useAppState();
  const dispatch = useDispatch();
  const audioInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [jsonFile, setJsonFile] = useState<File | null>(null);
  const [jsonError, setJsonError] = useState<string | null>(null);

  const isReady = lyrics.lines.length > 0 && audioUrl !== null;

  const audio = useAudio({
    url: audioUrl,
    container: containerRef,
  });

  const handleAudioFile = useCallback(
    (file: File) => {
      if (
        !AUDIO_ACCEPT.includes(file.type) &&
        !file.name.match(/\.(mp3|wav|ogg|m4a|webm|flac)$/i)
      ) {
        return;
      }
      const url = URL.createObjectURL(file);
      const el = new Audio(url);
      el.addEventListener("loadedmetadata", () => {
        dispatch({ type: "SET_AUDIO", file, url, duration: el.duration });
      });
    },
    [dispatch],
  );

  const handleJsonFile = useCallback(
    (file: File) => {
      setJsonError(null);
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result as string);
          if (!data.lines || !Array.isArray(data.lines)) {
            setJsonError('Invalid format: missing "lines" array');
            return;
          }
          const loaded: SyncedLyrics = {
            metadata: {
              title: data.metadata?.title ?? "",
              artist: data.metadata?.artist ?? "",
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
                    text: (w.text as string) ?? "",
                    startTime: (w.startTime as number) ?? null,
                    endTime: (w.endTime as number) ?? null,
                  }))
                : [],
            })),
          };
          const mode: SyncMode =
            data.metadata?.syncMode === "line" ? "line" : "word";
          dispatch({
            type: "LOAD_SYNCED_LYRICS",
            lyrics: loaded,
            syncMode: mode,
          });
          setJsonFile(file);
        } catch {
          setJsonError("Could not parse JSON file");
        }
      };
      reader.readAsText(file);
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
          {/* Upload row */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* JSON upload */}
            <div
              className={`flex-1 flex items-center justify-center min-h-[100px] border-2 border-dashed rounded-lg cursor-pointer transition-all bg-bg-surface ${
                jsonFile
                  ? "border-success border-solid"
                  : "border-border hover:border-accent hover:bg-accent/5"
              }`}
              onClick={() => jsonInputRef.current?.click()}
            >
              <input
                ref={jsonInputRef}
                type="file"
                accept=".json"
                hidden
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleJsonFile(file);
                }}
              />
              {jsonFile ? (
                <div className="flex flex-col items-center gap-1 text-success text-sm">
                  <span className="font-mono text-[13px]">{jsonFile.name}</span>
                  <span className="text-[11px] text-text-dim">
                    {lyrics.lines.length} lines loaded · Click to change
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1 text-text-muted text-sm">
                  <span className="text-xl">📄</span>
                  <span>Load synced lyrics JSON</span>
                </div>
              )}
            </div>

            {/* Audio upload */}
            <div
              className={`flex-1 flex items-center justify-center min-h-[100px] border-2 border-dashed rounded-lg cursor-pointer transition-all bg-bg-surface ${
                audioFile
                  ? "border-success border-solid"
                  : "border-border hover:border-accent hover:bg-accent/5"
              }`}
              onClick={() => audioInputRef.current?.click()}
            >
              <input
                ref={audioInputRef}
                type="file"
                accept="audio/*"
                hidden
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleAudioFile(file);
                }}
              />
              {audioFile ? (
                <div className="flex flex-col items-center gap-1 text-success text-sm">
                  <span className="font-mono text-[13px]">
                    {audioFile.name}
                  </span>
                  <span className="text-[11px] text-text-dim">
                    Click to change
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1 text-text-muted text-sm">
                  <span className="text-xl">🎵</span>
                  <span>Load audio file</span>
                </div>
              )}
            </div>
          </div>

          {jsonError && <p className="text-sm text-red-400">{jsonError}</p>}

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
              Load both a synced lyrics JSON and an audio file to start
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
