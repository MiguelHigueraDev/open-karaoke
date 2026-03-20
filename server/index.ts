import express from 'express';
import multer from 'multer';
import { execFile } from 'child_process';
import { mkdtemp, rm, readdir, access } from 'fs/promises';
import { createReadStream } from 'fs';
import { join, dirname } from 'path';
import { tmpdir } from 'os';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');
const VENV_DIR = join(PROJECT_ROOT, '.venv');
const VENV_PYTHON = join(VENV_DIR, 'bin', 'python3');

const PORT = parseInt(process.env.PORT || '3001', 10);
const app = express();

const upload = multer({ dest: join(tmpdir(), 'open-lyrics-uploads') });

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

app.post('/api/separate', upload.single('audio'), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'No audio file uploaded' });
    return;
  }

  const inputPath = req.file.path;
  let outputDir: string | undefined;

  try {
    outputDir = await mkdtemp(join(tmpdir(), 'demucs-out-'));

    await new Promise<void>((resolve, reject) => {
      const proc = execFile(
        VENV_PYTHON,
        [
          '-m',
          'demucs',
          '--two-stems', 'vocals',
          '-n', 'htdemucs',
          '-o', outputDir!,
          inputPath,
        ],
        { timeout: 600_000 }, // 10 minute timeout
        (err) => {
          if (err) reject(err);
          else resolve();
        },
      );

      proc.stderr?.on('data', (data: Buffer) => {
        process.stderr.write(data);
      });
    });

    // Find the no_vocals.wav file
    const modelDir = join(outputDir, 'htdemucs');
    const entries = await readdir(modelDir);
    const songDir = entries[0]; // demucs creates a dir named after the input file
    const instrumentalPath = join(modelDir, songDir, 'no_vocals.wav');

    res.setHeader('Content-Type', 'audio/wav');
    res.setHeader('Content-Disposition', 'attachment; filename="instrumental.wav"');

    const stream = createReadStream(instrumentalPath);
    stream.pipe(res);
    stream.on('error', () => {
      res.status(500).json({ error: 'Failed to read output file' });
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Separation failed';
    console.error('Demucs error:', message);

    if (!res.headersSent) {
      res.status(500).json({ error: message });
    }
  } finally {
    // Clean up temp files after response finishes
    res.on('finish', async () => {
      await rm(inputPath, { force: true }).catch(() => {});
      if (outputDir) {
        await rm(outputDir, { recursive: true, force: true }).catch(() => {});
      }
    });
  }
});

app.listen(PORT, () => {
  console.log(`Vocal separation server running on http://localhost:${PORT}`);
});
