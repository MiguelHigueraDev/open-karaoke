import { useState } from "react";
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

function TermsOfService() {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-10 max-w-[700px] w-full text-center">
      <button
        className="text-[11px] text-text-dim underline underline-offset-2 cursor-pointer hover:text-text-muted transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        Terms of Service
      </button>

      {open && (
        <div className="mt-4 text-left text-[11px] leading-relaxed text-text-dim border border-border rounded-lg p-5 bg-bg-surface space-y-3">
          <p className="font-semibold text-text-muted text-xs">
            Terms of Service
          </p>

          <p>
            By using Open Karaoke you agree to the following terms. If you do
            not agree, please do not use the service.
          </p>

          <p className="font-semibold text-text-muted">Content Ownership & Rights</p>
          <p>
            You must only upload audio, lyrics, or other media that you own or
            have explicit permission to use. You are solely responsible for
            ensuring that any content you upload does not infringe on the
            copyrights, trademarks, or other intellectual property rights of
            any third party. Open Karaoke assumes no liability for
            unauthorized use of copyrighted material.
          </p>

          <p className="font-semibold text-text-muted">Data Processing & Storage</p>
          <p>
            Nothing is stored permanently on our servers. All uploaded media
            and generated data are processed in memory only and are
            automatically discarded once your session ends. We do not retain,
            archive, or back up any user-uploaded content.
          </p>

          <p className="font-semibold text-text-muted">Disclaimer of Warranties</p>
          <p>
            Open Karaoke is provided "as is" without warranties of any kind,
            express or implied. We do not guarantee that the service will be
            uninterrupted, error-free, or free of harmful components. Use of
            the service is at your own risk.
          </p>

          <p className="font-semibold text-text-muted">Limitation of Liability</p>
          <p>
            To the fullest extent permitted by law, Open Karaoke and its
            contributors shall not be liable for any direct, indirect,
            incidental, or consequential damages arising from your use of the
            service or any content uploaded to it.
          </p>
        </div>
      )}
    </div>
  );
}

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
      <TermsOfService />
    </div>
  );
}
