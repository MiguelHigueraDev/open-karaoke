import { useAppState, useDispatch } from '../../state/lyrics-context';

export function LyricsInput() {
  const { rawLyrics } = useAppState();
  const dispatch = useDispatch();

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="lyrics-textarea" className="text-sm text-text-muted">
        Paste lyrics
      </label>
      <textarea
        id="lyrics-textarea"
        placeholder={'Paste your lyrics here...\nOne line per line.\nEmpty lines are ignored.'}
        value={rawLyrics}
        onChange={(e) =>
          dispatch({ type: 'SET_RAW_LYRICS', text: e.target.value })
        }
        rows={14}
        spellCheck={false}
        className="w-full bg-bg-surface border border-border rounded-lg text-text-primary font-mono text-[13px] leading-relaxed p-4 resize-y outline-none transition-colors focus:border-accent placeholder:text-text-dim"
      />
      {rawLyrics && (
        <p className="text-xs text-text-muted text-right">
          {rawLyrics.split('\n').filter((l) => l.trim()).length} lines parsed
        </p>
      )}
    </div>
  );
}
