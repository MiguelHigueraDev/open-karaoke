import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import type { SyncedLyrics, SyncMode } from '../../types/lyrics';
import { useAnimationFrame } from '../../hooks/use-animation-frame';

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
  const idleTimer = useRef<ReturnType<typeof setTimeout>>();

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
      if (e.code === 'Escape') {
        e.preventDefault();
        exitFullscreen();
      }
      resetIdleTimer();
    };
    const onMouse = () => resetIdleTimer();

    window.addEventListener('keydown', onKey);
    window.addEventListener('mousemove', onMouse);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('mousemove', onMouse);
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

  const windowStart = Math.max(0, activeLineIdx - 1);
  const windowEnd = Math.min(lyrics.lines.length, activeLineIdx + 3);
  const visibleLines = lyrics.lines.slice(
    Math.max(windowStart, 0),
    Math.max(windowEnd, Math.min(4, lyrics.lines.length)),
  );

  const lyricsContent = (
    <>
      {visibleLines.map((line) => {
        const isActive =
          line.startTime !== null &&
          line.endTime !== null &&
          currentTime >= line.startTime &&
          currentTime < line.endTime;

        const isPast =
          line.endTime !== null && currentTime >= line.endTime;

        return (
          <div
            key={line.id}
            className={`text-center transition-all duration-300 ${
              isActive
                ? fullscreen
                  ? 'text-[42px] font-bold'
                  : 'text-[28px] font-bold'
                : fullscreen
                  ? 'text-2xl'
                  : 'text-xl'
            } ${
              syncMode === 'line'
                ? isActive
                  ? 'text-accent-glow'
                  : isPast
                    ? 'text-text-muted'
                    : 'text-text-dim'
                : 'text-text-dim'
            }`}
          >
            {line.isInstrumental ? (
              syncMode === 'line' ? (
                <span className="italic">♪ Instrumental ♪</span>
              ) : (
                <span
                  className={`italic ${isActive ? 'karaoke-word' : ''}`}
                  style={
                    isActive
                      ? ({
                          '--progress': `${(() => {
                            const s = line.startTime ?? 0;
                            const e = line.endTime ?? s;
                            const d = e - s;
                            if (currentTime >= e) return 100;
                            if (currentTime > s && d > 0)
                              return ((currentTime - s) / d) * 100;
                            return 0;
                          })()}%`,
                        } as React.CSSProperties)
                      : undefined
                  }
                >
                  ♪ Instrumental ♪
                </span>
              )
            ) : syncMode === 'line' ? (
              <span>{line.words.map((w) => w.text).join(' ')}</span>
            ) : (
              line.words.map((word) => {
                const wordStart = word.startTime ?? 0;
                const wordEnd = word.endTime ?? wordStart;
                const wordDuration = wordEnd - wordStart;

                let wordProgress = 0;
                if (currentTime >= wordEnd) wordProgress = 1;
                else if (currentTime > wordStart && wordDuration > 0)
                  wordProgress = (currentTime - wordStart) / wordDuration;

                return (
                  <span
                    key={word.id}
                    className="karaoke-word"
                    style={
                      {
                        '--progress': `${wordProgress * 100}%`,
                      } as React.CSSProperties
                    }
                  >
                    {word.text}{' '}
                  </span>
                );
              })
            )}
          </div>
        );
      })}
    </>
  );

  if (fullscreen) {
    return (
      <div
        className={`fixed inset-0 z-50 flex flex-col bg-bg ${showControls ? 'cursor-default' : 'cursor-none'}`}
      >
        <div
          className={`absolute top-5 right-5 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        >
          <button
            className="px-3 py-1.5 text-xs border border-border rounded-lg bg-bg-surface text-text-muted cursor-pointer transition-all hover:bg-bg-elevated hover:border-accent hover:text-text-primary"
            onClick={exitFullscreen}
          >
            Exit Fullscreen
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-6 px-10">
          {lyricsContent}
        </div>
        <div
          className={`px-6 py-4 border-t border-border transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
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
      <div className="flex flex-col items-center justify-center gap-4 min-h-[300px] py-10 px-6 bg-bg-surface rounded-lg">
        {lyricsContent}
      </div>
    </div>
  );
}
