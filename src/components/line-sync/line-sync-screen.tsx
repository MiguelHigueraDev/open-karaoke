import { useCallback, useEffect, useRef, useState } from 'react';
import { StepShell } from '../layout/step-shell';
import { WaveformPlayer } from './waveform-player';
import { useAppState, useDispatch } from '../../state/lyrics-context';
import { formatTime } from '../../lib/time-utils';

export function LineSyncScreen() {
  const { lyrics, syncMode } = useAppState();
  const dispatch = useDispatch();
  const getCurrentTimeRef = useRef<() => number>(() => 0);
  const isPlayingRef = useRef(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const activeLineRef = useRef<HTMLDivElement>(null);

  const nextUnsyncedIdx = lyrics.lines.findIndex((l) => l.startTime === null);
  const allSynced = nextUnsyncedIdx === -1;

  const handleTap = useCallback(() => {
    if (!isPlayingRef.current || allSynced) return;
    const time = getCurrentTimeRef.current();
    dispatch({ type: 'SET_LINE_TIME', lineIndex: nextUnsyncedIdx, time });
  }, [dispatch, nextUnsyncedIdx, allSynced]);

  const handleUndo = useCallback(() => {
    dispatch({ type: 'UNDO_LINE_TIME' });
  }, [dispatch]);

  const handleInsertInstrumental = useCallback(() => {
    if (!isPlayingRef.current || allSynced) return;
    const time = getCurrentTimeRef.current();
    dispatch({ type: 'INSERT_INSTRUMENTAL', atIndex: nextUnsyncedIdx, time });
  }, [dispatch, nextUnsyncedIdx, allSynced]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;
      if (e.code === 'Space') {
        e.preventDefault();
        handleTap();
      } else if (e.code === 'Backspace') {
        e.preventDefault();
        handleUndo();
      } else if (e.code === 'KeyI') {
        e.preventDefault();
        handleInsertInstrumental();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleTap, handleUndo, handleInsertInstrumental]);

  useEffect(() => {
    activeLineRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  }, [nextUnsyncedIdx]);

  const handleNext = () => {
    dispatch({ type: 'FINALIZE_LINES', duration: lyrics.metadata.duration });
  };

  return (
    <StepShell nextLabel={syncMode === 'word' ? 'Start Word Sync' : 'Preview'} onNext={handleNext}>
      <div className="flex flex-col gap-4">
        <WaveformPlayer
          getCurrentTimeRef={getCurrentTimeRef}
          isPlayingRef={isPlayingRef}
          playbackRate={playbackRate}
        />

        <div className="flex justify-between items-center px-4 py-3 bg-bg-surface rounded-lg text-sm text-text-muted">
          <p>
            <kbd className="inline-block px-2 py-0.5 text-xs font-mono bg-bg-elevated border border-border rounded text-accent-glow">
              Space
            </kbd>{' '}
            line start{' · '}
            <kbd className="inline-block px-2 py-0.5 text-xs font-mono bg-bg-elevated border border-border rounded text-accent-glow">
              I
            </kbd>{' '}
            instrumental break{' · '}
            <kbd className="inline-block px-2 py-0.5 text-xs font-mono bg-bg-elevated border border-border rounded text-accent-glow">
              Backspace
            </kbd>{' '}
            undo
          </p>
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-text-dim mr-1">Speed:</label>
            {[0.5, 0.75, 1].map((rate) => (
              <button
                key={rate}
                className={`px-3 py-1 text-xs border rounded-lg cursor-pointer transition-all ${
                  playbackRate === rate
                    ? 'bg-accent border-accent text-white'
                    : 'bg-bg-surface border-border text-text-primary hover:bg-bg-elevated hover:border-accent'
                }`}
                onClick={() => setPlaybackRate(rate)}
              >
                {rate}x
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-0.5 max-h-[400px] overflow-y-auto">
          {lyrics.lines.map((line, i) => {
            const isSynced = line.startTime !== null;
            const isActive = i === nextUnsyncedIdx;
            return (
              <div
                key={line.id}
                ref={isActive ? activeLineRef : undefined}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-md text-sm transition-all border ${
                  isActive
                    ? 'bg-accent/10 border-accent'
                    : isSynced
                      ? 'bg-success/5 border-transparent'
                      : 'border-transparent'
                }`}
              >
                <span
                  className={`font-mono text-xs min-w-[90px] ${isSynced ? 'text-success' : 'text-text-dim'}`}
                >
                  {isSynced ? formatTime(line.startTime) : '--:--.---'}
                </span>
                <span
                  className={`${
                    isActive
                      ? 'text-text-primary font-semibold'
                      : isSynced
                        ? 'text-text-muted'
                        : 'text-text-dim'
                  } ${line.isInstrumental ? 'italic' : ''}`}
                >
                  {line.isInstrumental
                    ? '♪ Instrumental ♪'
                    : line.words.map((w) => w.text).join(' ')}
                </span>
              </div>
            );
          })}
        </div>

        {allSynced && (
          <div className="flex items-center justify-center gap-3 p-4 bg-success/[0.08] border border-success/20 rounded-lg text-success text-sm font-semibold">
            All lines synced! Click Next to{' '}
            {syncMode === 'word' ? 'sync words' : 'preview'}.
          </div>
        )}
      </div>
    </StepShell>
  );
}
