import { useCallback, useRef } from 'react';
import { StepShell } from '../layout/step-shell';
import { useAppState } from '../../state/lyrics-context';
import { useAudio } from '../../hooks/use-audio';
import { KaraokeRenderer } from './karaoke-renderer';
import { PlaybackControls } from '../shared/playback-controls';

export function PreviewScreen() {
  const { lyrics, syncMode, audioUrl } = useAppState();
  const containerRef = useRef<HTMLDivElement>(null);

  const audio = useAudio({
    url: audioUrl,
    container: containerRef,
  });

  const handlePlayFromStart = useCallback(() => {
    if (!audio.isPlaying) {
      audio.seekTo(0);
      audio.play();
    } else {
      audio.pause();
    }
  }, [audio]);

  const controls = (
    <PlaybackControls
      isPlaying={audio.isPlaying}
      isReady={audio.isReady}
      currentTime={audio.currentTime}
      duration={audio.duration}
      onPlayFromStart={handlePlayFromStart}
      onTogglePlay={audio.togglePlay}
      onSeek={audio.seekTo}
    />
  );

  return (
    <StepShell nextLabel="Export">
      <div className="flex flex-col gap-4">
        <div
          ref={containerRef}
          className="bg-bg-surface rounded-lg p-2 border border-border"
        />
        {controls}

        <KaraokeRenderer
          lyrics={lyrics}
          syncMode={syncMode}
          getCurrentTime={audio.getCurrentTime}
          isPlaying={audio.isPlaying}
          controls={controls}
        />
      </div>
    </StepShell>
  );
}
