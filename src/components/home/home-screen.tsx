import { useDispatch } from "../../state/lyrics-context";

const MODES = [
  {
    mode: "creator" as const,
    icon: "🎤",
    title: "Creator",
    desc: "Sync lyrics to audio with line and word-level precision. Export as video or JSON.",
  },
  {
    mode: "player" as const,
    icon: "🎶",
    title: "Player",
    desc: "Load synced lyrics JSON and an audio file to play karaoke.",
  },
];

export function HomeScreen() {
  const dispatch = useDispatch();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 md:px-6">
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-text-primary mb-2">
        Open Karaoke
      </h1>
      <p className="text-sm md:text-base text-text-muted mb-10">
        Create or play synced lyrics
      </p>
      <div className="flex flex-col sm:flex-row gap-5 w-full max-w-[700px]">
        {MODES.map((m) => (
          <button
            key={m.mode}
            className="flex-1 flex flex-col items-center gap-3 p-8 md:p-10 border border-border rounded-xl bg-bg-surface cursor-pointer transition-all hover:bg-bg-elevated hover:border-accent group"
            onClick={() => dispatch({ type: "SET_APP_MODE", mode: m.mode })}
          >
            <span className="text-4xl md:text-5xl">{m.icon}</span>
            <span className="text-base md:text-lg font-semibold text-text-primary group-hover:text-accent">
              {m.title}
            </span>
            <span className="text-xs md:text-sm text-text-dim text-center leading-relaxed">
              {m.desc}
            </span>
          </button>
        ))}
      </div>
      <p className="mt-10 max-w-[700px] text-center text-[11px] leading-relaxed text-text-dim">
        Only upload content you have the rights to use. Uploaded media is
        processed on our server but is not stored permanently.
      </p>
    </div>
  );
}
