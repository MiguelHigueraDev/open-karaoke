import { useState } from 'react';
import type { SyncedLyrics, SyncMode } from '../../types/lyrics';
import { useAnimationFrame } from '../../hooks/use-animation-frame';

interface Props {
  lyrics: SyncedLyrics;
  syncMode: SyncMode;
  getCurrentTime: () => number;
  isPlaying: boolean;
}

export function KaraokeRenderer({
  lyrics,
  syncMode,
  getCurrentTime,
  isPlaying,
}: Props) {
  const [currentTime, setCurrentTime] = useState(0);

  useAnimationFrame(() => {
    setCurrentTime(getCurrentTime());
  }, isPlaying);

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

  return (
    <div className="flex flex-col items-center justify-center gap-4 min-h-[300px] py-10 px-6 bg-bg-surface rounded-lg">
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
                ? 'text-[28px] font-bold'
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
    </div>
  );
}
