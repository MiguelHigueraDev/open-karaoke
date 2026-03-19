import { useRef } from 'react';
import { StepShell } from '../layout/step-shell';
import { useAppState } from '../../state/lyrics-context';
import { useAudio } from '../../hooks/use-audio';
import { KaraokeRenderer } from './karaoke-renderer';
import { formatTime } from '../../lib/time-utils';

export function PreviewScreen() {
  const { lyrics, audioUrl } = useAppState();
  const containerRef = useRef<HTMLDivElement>(null);

  const audio = useAudio({
    url: audioUrl,
    container: containerRef,
  });

  return (
    <StepShell nextLabel="Export">
      <div className="flex flex-col gap-4">
        <div
          ref={containerRef}
          className="bg-bg-surface rounded-lg p-2 border border-border"
        />
        <div className="flex items-center gap-3">
          <button
            className="min-w-[120px] px-5 py-2.5 border border-border rounded-lg bg-bg-surface text-text-primary text-sm cursor-pointer transition-all hover:bg-bg-elevated hover:border-accent disabled:opacity-40 disabled:cursor-not-allowed"
            onClick={() => {
              if (!audio.isPlaying) {
                audio.seekTo(0);
                audio.play();
              } else {
                audio.pause();
              }
            }}
            disabled={!audio.isReady}
          >
            {audio.isPlaying ? '⏸ Pause' : '▶ Play from Start'}
          </button>
          <button
            className="px-3 py-1 text-xs border border-border rounded-lg bg-bg-surface text-text-primary cursor-pointer transition-all hover:bg-bg-elevated hover:border-accent disabled:opacity-40 disabled:cursor-not-allowed"
            onClick={audio.togglePlay}
            disabled={!audio.isReady}
          >
            {audio.isPlaying ? '⏸' : '▶'} Resume
          </button>
          <span className="font-mono text-[13px] text-text-muted">
            {formatTime(audio.currentTime)} / {formatTime(audio.duration)}
          </span>
        </div>

        <KaraokeRenderer
          lyrics={lyrics}
          getCurrentTime={audio.getCurrentTime}
          isPlaying={audio.isPlaying}
        />
      </div>
    </StepShell>
  );
}
