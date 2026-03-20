# Open Karaoke

A web app for creating and playing synced karaoke lyrics. Sync lyrics to audio with word or line-level precision, preview with real-time karaoke rendering, and export as JSON or MP4 video with optional AI vocal removal.

## Modes

The app has two modes:

### Creator

A step-by-step workflow for syncing lyrics to audio.

1. **Upload** — Drop in an audio file (MP3, WAV, OGG, FLAC, M4A) and paste plain-text lyrics. Add song title and artist. Use `[INSTRUMENTAL]` on its own line to mark instrumental breaks. Choose between **word-level** or **line-level** sync mode.
2. **Line Sync** — Play the audio and press `Space` each time a new line starts being sung. Press `I` to insert an instrumental break on the fly. `Backspace` to undo. Adjustable playback speed (0.5x, 0.75x, 1x).
3. **Word Sync** *(word mode only)* — For each line, the audio loops over that line's segment. Press `Space` for each word as it's sung. Instrumental lines are automatically skipped. Navigate between lines freely and re-sync any line.
4. **Preview** — Watch karaoke-style playback with a gradient wipe effect across each word (word mode) or line highlighting (line mode). Supports fullscreen with auto-hiding controls. Instrumental breaks display animated dots.
5. **Export** — Copy synced lyrics JSON to clipboard, download as `.json`, or render as an MP4 video with optional vocal removal.

### Player

Load a previously exported lyrics JSON and any audio file to play karaoke. Includes the full karaoke renderer with waveform controls, fullscreen mode, and video export.

## Video Export

Export synced lyrics as a 1080p MP4 video rendered server-side:

- **Vocal removal** — Optionally strip vocals using [Demucs](https://github.com/facebookresearch/demucs) (AI-powered source separation) to produce an instrumental-only track.
- **Karaoke rendering** — Frame-by-frame canvas rendering of lyrics with the same gradient wipe, line highlighting, and animated instrumental dots as the in-browser preview.
- **Output** — H.264 video + AAC audio, 1920x1080 @ 30 FPS, web-optimized MP4.

## Output Format

```json
{
  "metadata": {
    "title": "Song Title",
    "artist": "Artist",
    "duration": 210,
    "syncMode": "word"
  },
  "lines": [
    {
      "id": "l0",
      "index": 0,
      "isInstrumental": false,
      "startTime": 14.5,
      "endTime": 17.8,
      "words": [
        { "id": "l0w0", "text": "Never", "startTime": 14.5, "endTime": 15.1 },
        { "id": "l0w1", "text": "gonna", "startTime": 15.1, "endTime": 15.6 },
        { "id": "l0w2", "text": "give", "startTime": 15.6, "endTime": 16.2 },
        { "id": "l0w3", "text": "you", "startTime": 16.2, "endTime": 16.5 },
        { "id": "l0w4", "text": "up", "startTime": 16.5, "endTime": 17.8 }
      ]
    },
    {
      "id": "l1",
      "index": 1,
      "isInstrumental": true,
      "startTime": 17.8,
      "endTime": 25.0,
      "words": []
    }
  ]
}
```

Times are in seconds. Each word has a `startTime` and `endTime`, enabling smooth karaoke-style rendering in any player that consumes this format. Instrumental lines have `isInstrumental: true` and an empty `words` array. The `syncMode` field indicates whether the lyrics were synced at the word or line level.

## Development

```sh
pnpm install
pnpm dev
```

For video export and vocal removal, the server requires FFmpeg and a Python environment with Demucs:

```sh
pnpm setup:demucs   # creates .venv and installs demucs
pnpm server         # starts the Express server on port 3001
```

## Tech Stack

- React 19 + TypeScript
- Vite 8
- Tailwind CSS 4
- wavesurfer.js (audio waveform + playback)
- Express + @napi-rs/canvas (server-side video rendering)
- FFmpeg (video encoding)
- Demucs (AI vocal removal)
