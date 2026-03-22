import { useCallback, useEffect, useRef, useState } from 'react';
import type { SyncedLyrics, SyncMode } from '../../types/lyrics';
import { drawFrame, VIDEO_WIDTH, VIDEO_HEIGHT } from '../../lib/export-video';
import { formatTime } from '../../lib/time-utils';

interface Props {
  lyrics: SyncedLyrics;
  syncMode: SyncMode;
  audioUrl: string;
}

export function VideoPreview({ lyrics, syncMode, audioUrl }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  /** Current time in ms. */
  const [currentTime, setCurrentTime] = useState(0);
  /** Duration in ms. */
  const [duration, setDuration] = useState(0);

  // Create audio element
  useEffect(() => {
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    audio.addEventListener('loadedmetadata', () => {
      setDuration(audio.duration * 1000);
    });
    audio.addEventListener('play', () => setIsPlaying(true));
    audio.addEventListener('pause', () => setIsPlaying(false));
    audio.addEventListener('ended', () => setIsPlaying(false));

    return () => {
      audio.pause();
      audio.src = '';
      audioRef.current = null;
    };
  }, [audioUrl]);

  // Render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    function render() {
      const timeMs = (audioRef.current?.currentTime ?? 0) * 1000;
      setCurrentTime(timeMs);
      drawFrame(ctx, lyrics, syncMode, timeMs);
      rafRef.current = requestAnimationFrame(render);
    }

    rafRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafRef.current);
  }, [lyrics, syncMode]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) audio.play();
    else audio.pause();
  }, []);

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audio.currentTime = (ratio * duration) / 1000;
  }, [duration]);

  return (
    <div className="flex flex-col gap-3">
      <div className="relative rounded-lg overflow-hidden border border-border bg-bg-surface">
        <canvas
          ref={canvasRef}
          width={VIDEO_WIDTH}
          height={VIDEO_HEIGHT}
          className="w-full h-auto block"
          style={{ aspectRatio: `${VIDEO_WIDTH} / ${VIDEO_HEIGHT}` }}
        />
      </div>
      <div className="flex items-center gap-3">
        <button
          className="px-3 py-1.5 border border-border rounded-lg bg-bg-surface text-text-primary text-sm cursor-pointer transition-all hover:bg-bg-elevated hover:border-accent min-w-[4rem]"
          onClick={togglePlay}
        >
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        <div
          className="flex-1 h-2 bg-bg-surface rounded-full overflow-hidden border border-border cursor-pointer"
          onClick={handleSeek}
        >
          <div
            className="h-full bg-accent rounded-full pointer-events-none"
            style={{ width: duration ? `${(currentTime / duration) * 100}%` : '0%' }}
          />
        </div>
        <span className="text-xs text-text-muted tabular-nums">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>
    </div>
  );
}
