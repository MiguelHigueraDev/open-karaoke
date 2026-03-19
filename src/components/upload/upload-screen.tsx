import { StepShell } from '../layout/step-shell';
import { AudioDropZone } from './audio-drop-zone';
import { LyricsInput } from './lyrics-input';
import { useAppState, useDispatch } from '../../state/lyrics-context';
import type { SyncMode } from '../../types/lyrics';

const SYNC_OPTIONS: { value: SyncMode; label: string; desc: string }[] = [
  { value: 'word', label: 'Word-level', desc: 'Sync each word individually (more precise)' },
  { value: 'line', label: 'Line-level', desc: 'Sync lines only (faster)' },
];

export function UploadScreen() {
  const { lyrics, syncMode } = useAppState();
  const dispatch = useDispatch();

  return (
    <StepShell nextLabel="Start Line Sync">
      <div className="flex flex-col gap-7">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-text-muted mb-2.5">
            Audio
          </h2>
          <AudioDropZone />
        </div>
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-text-muted mb-2.5">
            Lyrics
          </h2>
          <LyricsInput />
        </div>
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-text-muted mb-2.5">
            Song Info
          </h2>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Song title"
              value={lyrics.metadata.title}
              onChange={(e) =>
                dispatch({
                  type: 'SET_METADATA',
                  title: e.target.value,
                  artist: lyrics.metadata.artist,
                })
              }
              className="flex-1 bg-bg-surface border border-border rounded-lg text-text-primary text-sm py-2.5 px-3.5 outline-none focus:border-accent placeholder:text-text-dim"
            />
            <input
              type="text"
              placeholder="Artist"
              value={lyrics.metadata.artist}
              onChange={(e) =>
                dispatch({
                  type: 'SET_METADATA',
                  title: lyrics.metadata.title,
                  artist: e.target.value,
                })
              }
              className="flex-1 bg-bg-surface border border-border rounded-lg text-text-primary text-sm py-2.5 px-3.5 outline-none focus:border-accent placeholder:text-text-dim"
            />
          </div>
        </div>
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-text-muted mb-2.5">
            Sync Mode
          </h2>
          <div className="flex gap-3">
            {SYNC_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                className={`flex-1 flex flex-col gap-1 px-4 py-3 border rounded-lg text-left cursor-pointer transition-all ${
                  syncMode === opt.value
                    ? 'border-accent bg-accent/10'
                    : 'border-border bg-bg-surface hover:bg-bg-elevated hover:border-accent'
                }`}
                onClick={() =>
                  dispatch({ type: 'SET_SYNC_MODE', mode: opt.value })
                }
              >
                <span
                  className={`text-sm font-semibold ${
                    syncMode === opt.value
                      ? 'text-accent'
                      : 'text-text-primary'
                  }`}
                >
                  {opt.label}
                </span>
                <span className="text-xs text-text-dim">{opt.desc}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </StepShell>
  );
}
