import { useCallback, useRef, useState } from 'react';
import { useDispatch, useAppState } from '../../state/lyrics-context';
import { MAX_DURATION_S } from '../../../shared/constants';

const ACCEPTED = [
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
  'audio/mp4',
  'audio/webm',
  'audio/flac',
];

export function AudioDropZone() {
  const dispatch = useDispatch();
  const { audioFile } = useAppState();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback(
    (file: File) => {
      if (
        !ACCEPTED.includes(file.type) &&
        !file.name.match(/\.(mp3|wav|ogg|m4a|webm|flac)$/i)
      ) {
        alert('Unsupported audio format');
        return;
      }
      const url = URL.createObjectURL(file);
      const audio = new Audio(url);
      audio.addEventListener('loadedmetadata', () => {
        if (audio.duration > MAX_DURATION_S) {
          URL.revokeObjectURL(url);
          alert(`Song exceeds the ${MAX_DURATION_S / 60}-minute limit`);
          return;
        }
        dispatch({ type: 'SET_AUDIO', file, url, duration: audio.duration });
      });
    },
    [dispatch],
  );

  return (
    <div
      className={`flex items-center justify-center min-h-[120px] h-full border-2 border-dashed rounded-lg cursor-pointer transition-all bg-bg-surface ${
        dragOver
          ? 'border-accent bg-accent/5'
          : audioFile
            ? 'border-success border-solid'
            : 'border-border hover:border-accent hover:bg-accent/5'
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
      }}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept="audio/*"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      {audioFile ? (
        <div className="flex flex-col items-center gap-2 text-success text-sm">
          <span className="text-2xl">♪</span>
          <span className="font-mono text-[13px]">{audioFile.name}</span>
          <span className="text-[11px] text-text-dim">Click to change</span>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 text-text-muted text-sm">
          <span className="text-[28px]">🎵</span>
          <span>Drop audio file here or click to browse</span>
          <span className="text-xs text-text-dim">
            MP3, WAV, OGG, FLAC, M4A
          </span>
        </div>
      )}
    </div>
  );
}
