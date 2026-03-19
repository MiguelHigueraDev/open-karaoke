import { useRef } from 'react';
import { useAudio } from '../../hooks/use-audio';
import { useAppState } from '../../state/lyrics-context';
import { formatTime } from '../../lib/time-utils';

interface Props {
  getCurrentTimeRef?: React.MutableRefObject<() => number>;
  isPlayingRef?: React.MutableRefObject<boolean>;
  playbackRate?: number;
}

export function WaveformPlayer({
  getCurrentTimeRef,
  isPlayingRef,
  playbackRate = 1,
}: Props) {
  const { audioUrl } = useAppState();
  const containerRef = useRef<HTMLDivElement>(null);

  const audio = useAudio({
    url: audioUrl,
    container: containerRef,
  });

  if (getCurrentTimeRef) getCurrentTimeRef.current = audio.getCurrentTime;
  if (isPlayingRef) isPlayingRef.current = audio.isPlaying;
  if (audio.isReady) audio.setPlaybackRate(playbackRate);

  return (
    <div>
      <div
        ref={containerRef}
        className="bg-bg-surface rounded-lg p-2 border border-border"
      />
      <div className="flex items-center gap-3 mt-2">
        <button
          className="min-w-[120px] px-5 py-2.5 border border-border rounded-lg bg-bg-surface text-text-primary text-sm cursor-pointer transition-all hover:bg-bg-elevated hover:border-accent disabled:opacity-40 disabled:cursor-not-allowed"
          onClick={audio.togglePlay}
          disabled={!audio.isReady}
        >
          {audio.isPlaying ? '⏸ Pause' : '▶ Play'}
        </button>
        <span className="font-mono text-[13px] text-text-muted">
          {formatTime(audio.currentTime)} / {formatTime(audio.duration)}
        </span>
      </div>
    </div>
  );
}
