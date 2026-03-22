import { useState } from 'react';
import { StepShell } from '../layout/step-shell';
import { useAppState } from '../../state/lyrics-context';
import { exportToJson } from '../../lib/export-json';
import { VideoExportPanel } from './video-export-panel';

export function ExportScreen() {
  const { lyrics, syncMode, audioUrl } = useAppState();
  const [copied, setCopied] = useState(false);
  const json = exportToJson(lyrics, syncMode);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${lyrics.metadata.title || 'lyrics'}-synced.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <StepShell>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: JSON export */}
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-text-primary">
            Synced Lyrics JSON
          </h2>
          <div className="flex gap-3">
            <button
              className="px-5 py-2.5 border border-accent rounded-lg bg-accent text-white text-sm font-semibold cursor-pointer transition-all hover:bg-accent-glow hover:border-accent-glow"
              onClick={handleCopy}
            >
              {copied ? 'Copied!' : 'Copy to Clipboard'}
            </button>
            <button
              className="px-5 py-2.5 border border-border rounded-lg bg-transparent text-text-primary text-sm cursor-pointer transition-all hover:bg-bg-elevated hover:border-accent"
              onClick={handleDownload}
            >
              Download .json
            </button>
          </div>
          <pre className="bg-bg-surface border border-border rounded-lg p-5 font-mono text-xs leading-relaxed text-text-muted overflow-auto max-h-[500px] lg:max-h-[60vh]">
            {json}
          </pre>
        </div>

        {/* Right: Video export */}
        {audioUrl && (
          <div>
            <VideoExportPanel
              lyrics={lyrics}
              syncMode={syncMode}
              audioUrl={audioUrl}
            />
          </div>
        )}
      </div>
    </StepShell>
  );
}
