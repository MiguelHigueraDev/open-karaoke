import { formatTime } from '../../lib/time-utils';

interface Props {
  isPlaying: boolean;
  isReady: boolean;
  currentTime: number;
  duration: number;
  onPlayFromStart: () => void;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
}

export function PlaybackControls({
  isPlaying,
  isReady,
  currentTime,
  duration,
  onPlayFromStart,
  onTogglePlay,
  onSeek,
}: Props) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <button
          className="min-w-[120px] px-5 py-2.5 border border-border rounded-lg bg-bg-surface text-text-primary text-sm cursor-pointer transition-all hover:bg-bg-elevated hover:border-accent disabled:opacity-40 disabled:cursor-not-allowed"
          onClick={onPlayFromStart}
          disabled={!isReady}
        >
          {isPlaying ? '⏸ Pause' : '▶ Play from Start'}
        </button>
        <button
          className="px-3 py-1 text-xs border border-border rounded-lg bg-bg-surface text-text-primary cursor-pointer transition-all hover:bg-bg-elevated hover:border-accent disabled:opacity-40 disabled:cursor-not-allowed"
          onClick={onTogglePlay}
          disabled={!isReady}
        >
          {isPlaying ? '⏸' : '▶'} Resume
        </button>
      </div>
      <input
        type="range"
        min={0}
        max={duration || 1}
        step={0.01}
        value={currentTime}
        onChange={(e) => onSeek(Number(e.target.value))}
        disabled={!isReady}
        className="w-full h-1.5 accent-accent cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
      />
      <div className="flex justify-between font-mono text-[11px] text-text-dim">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
}
