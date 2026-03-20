import express from 'express';
import multer from 'multer';
import { execFile, spawn } from 'child_process';
import { mkdtemp, rm, readdir, access } from 'fs/promises';
import { createReadStream } from 'fs';
import { join, dirname } from 'path';
import { tmpdir } from 'os';
import { fileURLToPath } from 'url';
import { createCanvas } from '@napi-rs/canvas';
import {
  drawFrame,
  VIDEO_WIDTH,
  VIDEO_HEIGHT,
  FPS,
  type DrawLyrics,
} from '../shared/draw-frame.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');
const VENV_DIR = join(PROJECT_ROOT, '.venv');
const VENV_PYTHON = join(VENV_DIR, 'bin', 'python3');

const PORT = parseInt(process.env.PORT || '3001', 10);
const app = express();

app.use(express.json({ limit: '50mb' }));

const upload = multer({ dest: join(tmpdir(), 'open-karaoke-uploads') });

// Check venv and demucs availability on startup
access(VENV_PYTHON)
  .then(() => {
    execFile(VENV_PYTHON, ['-m', 'demucs', '--help'], (err) => {
      if (err) {
        console.error(
          '\n⚠️  Demucs is not installed in the virtual environment.\n' +
            '   Run: pnpm setup:demucs\n',
        );
      }
    });
  })
  .catch(() => {
    console.error(
      '\n⚠️  Python virtual environment not found.\n' +
        '   Run: pnpm setup:demucs\n',
    );
  });

// Check ffmpeg availability on startup
execFile('ffmpeg', ['-version'], (err) => {
  if (err) {
    console.error(
      '\n⚠️  ffmpeg is not installed. Install it with:\n' +
        '   brew install ffmpeg\n',
    );
  }
});

// ---------------------------------------------------------------------------
// Demucs vocal separation
// ---------------------------------------------------------------------------
async function runDemucs(inputPath: string): Promise<string> {
  const outputDir = await mkdtemp(join(tmpdir(), 'demucs-out-'));

  await new Promise<void>((resolve, reject) => {
    const proc = execFile(
      VENV_PYTHON,
      [
        '-m',
        'demucs',
        '--two-stems', 'vocals',
        '-n', 'htdemucs',
        '-o', outputDir,
        inputPath,
      ],
      { timeout: 600_000 },
      (err) => {
        if (err) reject(err);
        else resolve();
      },
    );
    proc.stderr?.on('data', (data: Buffer) => process.stderr.write(data));
  });

  const modelDir = join(outputDir, 'htdemucs');
  const entries = await readdir(modelDir);
  const songDir = entries[0];
  return join(modelDir, songDir, 'no_vocals.wav');
}

// ---------------------------------------------------------------------------
// POST /api/export-video
// Accepts: multipart with "audio" file + "lyrics" JSON string + "syncMode" + "removeVocals"
// Returns: mp4 video file
// ---------------------------------------------------------------------------
app.post('/api/export-video', upload.single('audio'), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'No audio file uploaded' });
    return;
  }

  let lyrics: DrawLyrics;
  let syncMode: 'line' | 'word';
  let removeVocals: boolean;

  try {
    lyrics = JSON.parse(req.body.lyrics);
    syncMode = req.body.syncMode === 'line' ? 'line' : 'word';
    removeVocals = req.body.removeVocals === 'true';
  } catch {
    res.status(400).json({ error: 'Invalid request body' });
    return;
  }

  const inputAudioPath = req.file.path;
  const tempDirs: string[] = [];
  let audioPath = inputAudioPath;

  try {
    // Optional vocal removal
    if (removeVocals) {
      const instrumentalPath = await runDemucs(inputAudioPath);
      audioPath = instrumentalPath;
      // Track parent dir for cleanup
      tempDirs.push(dirname(dirname(dirname(instrumentalPath))));
    }

    // Get audio duration via ffprobe
    const duration = await new Promise<number>((resolve, reject) => {
      execFile(
        'ffprobe',
        [
          '-v', 'quiet',
          '-show_entries', 'format=duration',
          '-of', 'csv=p=0',
          audioPath,
        ],
        (err, stdout) => {
          if (err) reject(err);
          else resolve(parseFloat(stdout.trim()));
        },
      );
    });

    const totalFrames = Math.ceil(duration * FPS);

    // Set up canvas
    const canvas = createCanvas(VIDEO_WIDTH, VIDEO_HEIGHT);
    const ctx = canvas.getContext('2d');

    // Spawn ffmpeg: pipe raw RGBA frames in, output mp4 with audio
    const outputDir = await mkdtemp(join(tmpdir(), 'export-video-'));
    tempDirs.push(outputDir);
    const outputPath = join(outputDir, 'output.mp4');

    const ffmpeg = spawn('ffmpeg', [
      '-y',
      // Video input: raw frames from stdin
      '-f', 'rawvideo',
      '-pix_fmt', 'rgba',
      '-s', `${VIDEO_WIDTH}x${VIDEO_HEIGHT}`,
      '-r', String(FPS),
      '-i', 'pipe:0',
      // Audio input
      '-i', audioPath,
      // Encoding settings
      '-c:v', 'libx264',
      '-preset', 'fast',
      '-crf', '23',
      '-pix_fmt', 'yuv420p',
      '-c:a', 'aac',
      '-b:a', '192k',
      '-shortest',
      '-movflags', '+faststart',
      outputPath,
    ]);

    let ffmpegError = '';
    ffmpeg.stderr.on('data', (data: Buffer) => {
      ffmpegError += data.toString();
    });

    const ffmpegDone = new Promise<void>((resolve, reject) => {
      ffmpeg.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`ffmpeg exited with code ${code}: ${ffmpegError.slice(-500)}`));
      });
      ffmpeg.on('error', reject);
    });

    // Render frames and pipe to ffmpeg
    for (let frame = 0; frame < totalFrames; frame++) {
      const currentTime = frame / FPS;
      drawFrame(ctx, lyrics, syncMode, currentTime);

      // @napi-rs/canvas .data() returns raw RGBA pixel data
      const buffer = canvas.data();
      const canWrite = ffmpeg.stdin.write(buffer);
      if (!canWrite) {
        await new Promise<void>((resolve) => ffmpeg.stdin.once('drain', resolve));
      }
    }

    ffmpeg.stdin.end();
    await ffmpegDone;

    // Stream the result
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${(lyrics.metadata.title || 'karaoke').replace(/[^a-zA-Z0-9_-]/g, '_')}.mp4"`,
    );

    const stream = createReadStream(outputPath);
    stream.pipe(res);
    stream.on('error', () => {
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to read output file' });
      }
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Export failed';
    console.error('Export error:', message);
    if (!res.headersSent) {
      res.status(500).json({ error: message });
    }
  } finally {
    res.on('finish', async () => {
      await rm(inputAudioPath, { force: true }).catch(() => {});
      for (const dir of tempDirs) {
        await rm(dir, { recursive: true, force: true }).catch(() => {});
      }
    });
  }
});

app.listen(PORT, () => {
  console.log(`Open Karaoke server running on http://localhost:${PORT}`);
});
