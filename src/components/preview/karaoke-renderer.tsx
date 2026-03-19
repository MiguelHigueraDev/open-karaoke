import { useState } from 'react';
import type { SyncedLyrics } from '../../types/lyrics';
import { useAnimationFrame } from '../../hooks/use-animation-frame';

interface Props {
  lyrics: SyncedLyrics;
  getCurrentTime: () => number;
  isPlaying: boolean;
}

export function KaraokeRenderer({ lyrics, getCurrentTime, isPlaying }: Props) {
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

        return (
          <div
            key={line.id}
            className={`text-center transition-all duration-300 ${
              isActive
                ? 'text-[28px] font-bold text-text-dim'
                : 'text-xl text-text-dim'
            }`}
          >
            {line.isInstrumental ? (
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
            ) : (
              line.words.map((word) => {
                const wordStart = word.startTime ?? 0;
                const wordEnd = word.endTime ?? wordStart;
                const wordDuration = wordEnd - wordStart;

                let progress = 0;
                if (currentTime >= wordEnd) progress = 1;
                else if (currentTime > wordStart && wordDuration > 0)
                  progress = (currentTime - wordStart) / wordDuration;

                return (
                  <span
                    key={word.id}
                    className="karaoke-word"
                    style={
                      {
                        '--progress': `${progress * 100}%`,
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
