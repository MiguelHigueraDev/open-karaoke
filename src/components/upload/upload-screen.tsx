import { StepShell } from '../layout/step-shell';
import { AudioDropZone } from './audio-drop-zone';
import { LyricsInput } from './lyrics-input';
import { useAppState, useDispatch } from '../../state/lyrics-context';

export function UploadScreen() {
  const { lyrics } = useAppState();
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
      </div>
    </StepShell>
  );
}
