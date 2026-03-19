import { useDispatch } from '../../state/lyrics-context';

const MODES = [
  {
    mode: 'creator' as const,
    icon: '🎤',
    title: 'Lyrics Creator',
    desc: 'Sync lyrics to audio with line and word-level precision. Export as JSON.',
  },
  {
    mode: 'player' as const,
    icon: '🎶',
    title: 'Karaoke Player',
    desc: 'Load synced lyrics JSON and an audio file to play karaoke.',
  },
];

export function HomeScreen() {
  const dispatch = useDispatch();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6">
      <h1 className="text-3xl font-bold tracking-tight text-text-primary mb-2">
        Open Lyrics
      </h1>
      <p className="text-sm text-text-muted mb-10">
        Create or play synced lyrics
      </p>
      <div className="flex gap-5 w-full max-w-[600px]">
        {MODES.map((m) => (
          <button
            key={m.mode}
            className="flex-1 flex flex-col items-center gap-3 p-8 border border-border rounded-xl bg-bg-surface cursor-pointer transition-all hover:bg-bg-elevated hover:border-accent group"
            onClick={() =>
              dispatch({ type: 'SET_APP_MODE', mode: m.mode })
            }
          >
            <span className="text-4xl">{m.icon}</span>
            <span className="text-base font-semibold text-text-primary group-hover:text-accent">
              {m.title}
            </span>
            <span className="text-xs text-text-dim text-center leading-relaxed">
              {m.desc}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
