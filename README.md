# Open Lyrics

A web app for syncing lyrics to audio with word-level precision, karaoke-style. Upload a song, paste lyrics, tap along to the beat, and export time-synced lyrics as JSON.

## How It Works

The app walks you through a 5-step workflow:

1. **Upload** — Drop in an audio file (MP3, WAV, OGG, FLAC, M4A) and paste plain-text lyrics. Add song title and artist.
2. **Line Sync** — Play the audio and press `Space` each time a new line starts being sung. `Backspace` to undo. Adjustable playback speed (0.5x, 0.75x, 1x).
3. **Word Sync** — For each line, the audio loops over that line's segment. Press `Space` for each word as it's sung. Navigate between lines freely and re-sync any line.
4. **Preview** — Watch a karaoke-style playback with a gradient wipe effect across each word as it's sung.
5. **Export** — Copy the synced lyrics JSON to clipboard or download as a `.json` file.

## Output Format

```json
{
  "metadata": { "title": "Song Title", "artist": "Artist", "duration": 210 },
  "lines": [
    {
      "id": "l0",
      "index": 0,
      "startTime": 14.5,
      "endTime": 17.8,
      "words": [
        { "id": "l0w0", "text": "Never", "startTime": 14.5, "endTime": 15.1 },
        { "id": "l0w1", "text": "gonna", "startTime": 15.1, "endTime": 15.6 },
        { "id": "l0w2", "text": "give", "startTime": 15.6, "endTime": 16.2 },
        { "id": "l0w3", "text": "you", "startTime": 16.2, "endTime": 16.5 },
        { "id": "l0w4", "text": "up", "startTime": 16.5, "endTime": 17.8 }
      ]
    }
  ]
}
```

Times are in seconds. Each word has a `startTime` and `endTime`, enabling smooth karaoke-style rendering in any player that consumes this format.

## Development

```sh
pnpm install
pnpm dev
```

## Tech Stack

- React 19 + TypeScript
- Vite 8
- Tailwind CSS 4
- wavesurfer.js (audio waveform + playback)
