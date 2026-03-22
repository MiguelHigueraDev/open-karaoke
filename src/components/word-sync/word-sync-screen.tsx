import { useCallback, useEffect, useRef, useState } from 'react';
import { StepShell } from '../layout/step-shell';
import { useAppState, useDispatch } from '../../state/lyrics-context';
import { useAudio } from '../../hooks/use-audio';
import { useAnimationFrame } from '../../hooks/use-animation-frame';
import { formatTime } from '../../lib/time-utils';

export function WordSyncScreen() {
  const { lyrics, audioUrl } = useAppState();
  const dispatch = useDispatch();
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentLineIdx, setCurrentLineIdx] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);

  const audio = useAudio({
    url: audioUrl,
    container: containerRef,
  });

  const currentLine = lyrics.lines[currentLineIdx];
  const nextUnsyncedWordIdx =
    currentLine?.words.findIndex((w) => w.startTime === null) ?? -1;
  const allWordsInLineSynced = nextUnsyncedWordIdx === -1;

  useAnimationFrame(() => {
    if (!audio.isPlaying || !currentLine) return;
    const time = audio.getCurrentTime();
    const end = currentLine.endTime ?? lyrics.metadata.duration;
    if (time >= end) {
      audio.seekTo(currentLine.startTime ?? 0);
    }
  }, audio.isPlaying);

  useEffect(() => {
    if (
      currentLine?.startTime !== null &&
      currentLine?.startTime !== undefined &&
      audio.isReady
    ) {
      audio.seekTo(currentLine.startTime);
    }
  }, [currentLineIdx, audio.isReady]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTap = useCallback(() => {
    if (!audio.isPlaying || allWordsInLineSynced) return;
    const time = audio.getCurrentTime();
    dispatch({
      type: 'SET_WORD_TIME',
      lineIndex: currentLineIdx,
      wordIndex: nextUnsyncedWordIdx,
      time,
    });
  }, [
    audio,
    dispatch,
    currentLineIdx,
    nextUnsyncedWordIdx,
    allWordsInLineSynced,
  ]);

  const handleUndo = useCallback(() => {
    dispatch({ type: 'UNDO_WORD_TIME', lineIndex: currentLineIdx });
  }, [dispatch, currentLineIdx]);

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
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleTap, handleUndo]);

  useEffect(() => {
    if (allWordsInLineSynced && currentLine) {
      dispatch({ type: 'FINALIZE_WORDS', lineIndex: currentLineIdx });
    }
  }, [allWordsInLineSynced, currentLineIdx, currentLine, dispatch]);

  if (audio.isReady) audio.setPlaybackRate(playbackRate);

  const allLinesDone = lyrics.lines.every(
    (l) => l.isInstrumental || l.words.every((w) => w.startTime !== null),
  );

  const handleFinalize = () => {
    lyrics.lines.forEach((_, i) => {
      dispatch({ type: 'FINALIZE_WORDS', lineIndex: i });
    });
  };

  return (
    <StepShell nextLabel="Preview" onNext={handleFinalize}>
      <div className="flex flex-col gap-4">
        {/* Waveform */}
        <div
          ref={containerRef}
          className="bg-bg-surface rounded-lg p-2 border border-border"
        />
        <div className="flex items-center gap-3">
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

        {/* Instructions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 px-4 py-3 bg-bg-surface rounded-lg text-sm text-text-muted">
          <p>
            Press{' '}
            <kbd className="inline-block px-2 py-0.5 text-xs font-mono bg-bg-elevated border border-border rounded text-accent-glow">
              Space
            </kbd>{' '}
            when each word starts.{' '}
            <kbd className="inline-block px-2 py-0.5 text-xs font-mono bg-bg-elevated border border-border rounded text-accent-glow">
              Backspace
            </kbd>{' '}
            to undo.
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

        {/* Line navigator */}
        <div className="flex items-center justify-center gap-4">
          <button
            className="px-3 py-1 text-xs border border-border rounded-lg bg-bg-surface text-text-primary cursor-pointer transition-all hover:bg-bg-elevated hover:border-accent disabled:opacity-40 disabled:cursor-not-allowed"
            disabled={currentLineIdx === 0}
            onClick={() => setCurrentLineIdx((i) => i - 1)}
          >
            ← Prev Line
          </button>
          <span className="text-[13px] text-text-muted font-mono">
            Line {currentLineIdx + 1} / {lyrics.lines.length}
          </span>
          <button
            className="px-3 py-1 text-xs border border-border rounded-lg bg-bg-surface text-text-primary cursor-pointer transition-all hover:bg-bg-elevated hover:border-accent disabled:opacity-40 disabled:cursor-not-allowed"
            disabled={currentLineIdx >= lyrics.lines.length - 1}
            onClick={() => setCurrentLineIdx((i) => i + 1)}
          >
            Next Line →
          </button>
        </div>

        {/* Current line context */}
        <div className="px-4 py-3 bg-bg-surface rounded-lg">
          {currentLineIdx > 0 && (
            <div className="text-xs text-text-dim leading-relaxed">
              {lyrics.lines[currentLineIdx - 1].isInstrumental
                ? '♪ Instrumental ♪'
                : lyrics.lines[currentLineIdx - 1].words
                    .map((w) => w.text)
                    .join(' ')}
            </div>
          )}
          <div className="text-sm text-text-primary font-semibold leading-relaxed">
            {currentLine?.isInstrumental
              ? '♪ Instrumental ♪'
              : currentLine?.words.map((w) => w.text).join(' ')}
          </div>
        </div>

        {/* Word list / Instrumental indicator */}
        {currentLine?.isInstrumental ? (
          <div className="flex items-center justify-center gap-2 p-6 bg-bg-surface rounded-lg min-h-[80px] text-text-muted italic">
            ♪ Instrumental break — no words to sync ♪
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 p-4 bg-bg-surface rounded-lg min-h-[80px]">
            {currentLine?.words.map((word, i) => {
              const isSynced = word.startTime !== null;
              const isActive = i === nextUnsyncedWordIdx;
              return (
                <span
                  key={word.id}
                  className={`inline-flex flex-col items-center gap-1 px-3.5 py-2 rounded-md text-base border transition-all ${
                    isActive
                      ? 'text-text-primary border-accent bg-accent/10 font-semibold'
                      : isSynced
                        ? 'text-success bg-success/5 border-transparent'
                        : 'text-text-dim bg-bg border-transparent'
                  }`}
                >
                  {word.text}
                  {isSynced && (
                    <span className="text-[9px] font-mono text-text-dim">
                      {formatTime(word.startTime)}
                    </span>
                  )}
                </span>
              );
            })}
          </div>
        )}

        {allWordsInLineSynced && !allLinesDone && (
          <div className="flex items-center justify-center gap-3 p-4 bg-success/[0.08] border border-success/20 rounded-lg text-success text-sm font-semibold">
            Line done!{' '}
            <button
              className="px-3 py-1 text-xs border border-border rounded-lg bg-bg-surface text-text-primary cursor-pointer hover:bg-bg-elevated hover:border-accent"
              onClick={() =>
                dispatch({
                  type: 'RESET_WORD_SYNC',
                  lineIndex: currentLineIdx,
                })
              }
            >
              Re-sync this line
            </button>
            <button
              className="px-3 py-1 text-xs border border-accent rounded-lg bg-accent text-white font-semibold cursor-pointer hover:bg-accent-glow"
              onClick={() =>
                setCurrentLineIdx((i) =>
                  Math.min(i + 1, lyrics.lines.length - 1),
                )
              }
            >
              Next line →
            </button>
          </div>
        )}

        {allLinesDone && (
          <div className="flex items-center justify-center gap-3 p-4 bg-success/[0.08] border border-success/20 rounded-lg text-success text-sm font-semibold">
            All words synced! Click Next to preview.
          </div>
        )}
      </div>
    </StepShell>
  );
}
