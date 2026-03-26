import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { SyncedLyrics, SyncMode } from "../../types/lyrics";
import { useAnimationFrame } from "../../hooks/use-animation-frame";
import { InstrumentalDots } from "./instrumental-dots";

interface Props {
  lyrics: SyncedLyrics;
  syncMode: SyncMode;
  getCurrentTime: () => number;
  isPlaying: boolean;
  /** Controls (play/pause, time, etc.) rendered in fullscreen mode. */
  controls?: ReactNode;
}

export function KaraokeRenderer({
  lyrics,
  syncMode,
  getCurrentTime,
  isPlaying,
  controls,
}: Props) {
  const [currentTime, setCurrentTime] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);

  useAnimationFrame(() => {
    setCurrentTime(getCurrentTime());
  }, isPlaying);

  const exitFullscreen = useCallback(() => setFullscreen(false), []);
  const [showControls, setShowControls] = useState(true);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const resetIdleTimer = useCallback(() => {
    setShowControls(true);
    clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => setShowControls(false), 3000);
  }, []);

  useEffect(() => {
    if (!fullscreen) {
      setShowControls(true);
      clearTimeout(idleTimer.current);
      return;
    }
    resetIdleTimer();

    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Escape") {
        e.preventDefault();
        exitFullscreen();
      }
      resetIdleTimer();
    };
    const onMouse = () => resetIdleTimer();

    window.addEventListener("keydown", onKey);
    window.addEventListener("mousemove", onMouse);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousemove", onMouse);
      clearTimeout(idleTimer.current);
    };
  }, [fullscreen, exitFullscreen, resetIdleTimer]);

  const activeLineIdx = lyrics.lines.findIndex(
    (l) =>
      l.startTime !== null &&
      l.endTime !== null &&
      currentTime >= l.startTime &&
      currentTime < l.endTime,
  );

  // Track the last known active line so we keep position between lines
  const lastActiveIdx = useRef(0);
  if (activeLineIdx >= 0) lastActiveIdx.current = activeLineIdx;
  const effectiveIdx =
    activeLineIdx >= 0 ? activeLineIdx : lastActiveIdx.current;

  // Refs for smooth scroll offset calculation
  const viewportRef = useRef<HTMLDivElement>(null);
  const lineEls = useRef<Map<number, HTMLDivElement>>(new Map());
  const [scrollOffset, setScrollOffset] = useState(0);

  // Recalculate offset when active line changes
  useEffect(() => {
    const viewport = viewportRef.current;
    const lineEl = lineEls.current.get(effectiveIdx);
    if (!viewport || !lineEl) return;

    const vpHeight = viewport.clientHeight;
    const lineTop = lineEl.offsetTop;
    const lineHeight = lineEl.offsetHeight;
    setScrollOffset(vpHeight / 2 - lineTop - lineHeight / 2);
  }, [effectiveIdx, fullscreen]);

  // How many lines above/below active to show
  const VISIBLE_RANGE = 2;

  const lyricsContent = (
    <div
      ref={viewportRef}
      className="overflow-hidden"
      style={{ height: fullscreen ? "100%" : "300px" }}
    >
      <div
        className="flex flex-col items-center gap-4 transition-transform duration-700 ease-out"
        style={{
          transform: `translateY(${scrollOffset}px)`,
          paddingTop: fullscreen ? "40vh" : "130px",
          paddingBottom: fullscreen ? "40vh" : "130px",
        }}
      >
        {lyrics.lines.map((line, idx) => {
          const isActive =
            line.startTime !== null &&
            line.endTime !== null &&
            currentTime >= line.startTime &&
            currentTime < line.endTime;

          const isPast = line.endTime !== null && currentTime >= line.endTime;

          const dist = Math.abs(idx - effectiveIdx);
          // Lines beyond VISIBLE_RANGE fade to 0
          const visible = dist <= VISIBLE_RANGE;

          let opacity: number;
          if (isActive) {
            opacity = 1;
          } else if (!visible) {
            opacity = 0;
          } else if (dist === VISIBLE_RANGE) {
            opacity = 0.2;
          } else {
            opacity = isPast ? 0.4 : 0.5;
          }

          return (
            <div
              key={line.id}
              ref={(el) => {
                if (el) lineEls.current.set(idx, el);
                else lineEls.current.delete(idx);
              }}
              style={{ opacity, transform: `scale(${isActive ? 1 : 0.95})` }}
              className={`text-center transition-[opacity,transform,font-size,color] duration-500 ${
                isActive
                  ? fullscreen
                    ? "text-[42px] font-bold"
                    : "text-[28px] font-bold"
                  : fullscreen
                    ? "text-2xl"
                    : "text-xl"
              } ${
                syncMode === "line"
                  ? isActive
                    ? "text-accent-glow"
                    : isPast
                      ? "text-text-muted"
                      : "text-text-dim"
                  : "text-text-dim"
              }`}
            >
              {line.isInstrumental ? (
                <InstrumentalDots
                  isActive={isActive}
                  isPast={isPast}
                  progress={(() => {
                    const s = line.startTime ?? 0;
                    const e = line.endTime ?? s;
                    const d = e - s;
                    if (d <= 0 || currentTime >= e) return 1;
                    if (currentTime <= s) return 0;
                    return (currentTime - s) / d;
                  })()}
                  size={fullscreen ? "large" : "normal"}
                />
              ) : syncMode === "line" ? (
                <span>{line.words.map((w) => w.text).join(" ")}</span>
              ) : (
                line.words.map((word) => {
                  const wordStart = word.startTime ?? 0;
                  const wordEnd = word.endTime ?? wordStart;
                  const wordDuration = wordEnd - wordStart;

                  let wordProgress = 0;
                  if (currentTime >= wordEnd) wordProgress = 1;
                  else if (currentTime > wordStart && wordDuration > 0)
                    wordProgress = (currentTime - wordStart) / wordDuration;

                  // Settle: word starts slightly offset up, eases to 0 as it's sung
                  const maxOffset = fullscreen ? 4 : 3;
                  // Cubic ease-out for a gentle, smooth settle
                  const t = Math.min(wordProgress, 1);
                  const eased = 1 - (1 - t) ** 3;
                  const wordOffsetY =
                    wordProgress >= 1 ? 0 : maxOffset * (1 - eased);

                  return (
                    <span key={word.id} className="inline-block mr-[0.3em]">
                      <span
                        className="karaoke-word inline-block"
                        style={
                          {
                            "--progress": `${wordProgress * 100}%`,
                            transform: `translateY(${wordOffsetY}px)`,
                          } as React.CSSProperties
                        }
                      >
                        {word.text}
                      </span>
                    </span>
                  );
                })
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  if (fullscreen) {
    return (
      <div
        className={`fixed inset-0 z-50 flex flex-col bg-bg ${showControls ? "cursor-default" : "cursor-none"}`}
      >
        <div
          className={`absolute top-5 right-5 transition-opacity duration-300 ${showControls ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        >
          <button
            className="px-3 py-1.5 text-xs border border-border rounded-lg bg-bg-surface text-text-muted cursor-pointer transition-all hover:bg-bg-elevated hover:border-accent hover:text-text-primary"
            onClick={exitFullscreen}
          >
            Exit Fullscreen
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-10">
          {lyricsContent}
        </div>
        <div
          className={`px-6 py-4 border-t border-border transition-opacity duration-300 ${showControls ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        >
          {controls}
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        className="absolute top-2.5 right-2.5 px-2.5 py-1 text-[11px] border border-border rounded-md bg-bg-elevated/60 text-text-dim cursor-pointer transition-all hover:bg-bg-elevated hover:border-accent hover:text-text-primary z-10"
        onClick={() => setFullscreen(true)}
      >
        Fullscreen
      </button>
      <div className="px-6 bg-bg-surface rounded-lg">{lyricsContent}</div>
    </div>
  );
}
