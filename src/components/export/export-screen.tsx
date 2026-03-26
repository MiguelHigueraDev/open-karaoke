import { useState } from 'react';
import { StepShell } from '../layout/step-shell';
import { useAppState } from '../../state/lyrics-context';
import { exportToJson } from '../../lib/export-json';
import { exportToZip } from '../../lib/export-zip';
import { VideoExportPanel } from './video-export-panel';

export function ExportScreen() {
  const { lyrics, syncMode, audioUrl, audioFile } = useAppState();
  const [copied, setCopied] = useState(false);
  const [zipping, setZipping] = useState(false);
  const json = exportToJson(lyrics, syncMode);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadZip = async () => {
    if (!audioFile) return;
    setZipping(true);
    try {
      const blob = await exportToZip(lyrics, syncMode, audioFile);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${lyrics.metadata.title || 'lyrics'}-karaoke.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setZipping(false);
    }
  };

  return (
    <StepShell>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: JSON export */}
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-text-primary">
            Synced Lyrics
          </h2>
          <div className="flex gap-3">
            <button
              className="px-5 py-2.5 border border-accent rounded-lg bg-accent text-white text-sm font-semibold cursor-pointer transition-all hover:bg-accent-glow hover:border-accent-glow disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleDownloadZip}
              disabled={!audioFile || zipping}
            >
              {zipping ? 'Creating zip...' : 'Download .zip'}
            </button>
            <button
              className="px-5 py-2.5 border border-border rounded-lg bg-transparent text-text-primary text-sm cursor-pointer transition-all hover:bg-bg-elevated hover:border-accent"
              onClick={handleCopy}
            >
              {copied ? 'Copied!' : 'Copy JSON'}
            </button>
          </div>
          {!audioFile && (
            <p className="text-xs text-text-dim">
              Audio file not available — zip export requires the audio file.
            </p>
          )}
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
