import express from "express";
import multer from "multer";
import { execFile, spawn } from "child_process";
import { mkdtemp, rm, readdir, access, stat } from "fs/promises";
import { createReadStream } from "fs";
import { join, dirname } from "path";
import { tmpdir } from "os";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";
import { createCanvas, GlobalFonts } from "@napi-rs/canvas";
import {
  drawFrame,
  VIDEO_WIDTH,
  VIDEO_HEIGHT,
  FPS,
  type DrawLyrics,
} from "../shared/draw-frame.js";
import { MAX_DURATION_MS } from "../shared/constants.js";

// ---------------------------------------------------------------------------
// Job progress tracking
// ---------------------------------------------------------------------------
interface JobProgress {
  stage: "uploading" | "vocal-removal" | "encoding" | "done" | "error";
  progress: number; // 0-100
  message: string;
  outputPath?: string;
  tempDirs: string[];
  inputAudioPath?: string;
  filename: string;
  fileSize?: number;
}

const jobs = new Map<string, JobProgress>();

// Clean up completed jobs after 10 minutes
function scheduleJobCleanup(jobId: string) {
  setTimeout(async () => {
    const job = jobs.get(jobId);
    if (job) {
      if (job.inputAudioPath) {
        await rm(job.inputAudioPath, { force: true }).catch(() => {});
      }
      for (const dir of job.tempDirs) {
        await rm(dir, { recursive: true, force: true }).catch(() => {});
      }
      jobs.delete(jobId);
    }
  }, 10 * 60 * 1000);
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, "..");
const VENV_DIR = join(PROJECT_ROOT, ".venv");
const VENV_PYTHON = join(VENV_DIR, "bin", "python3");

// Register Inter font for server-side canvas rendering
GlobalFonts.registerFromPath(join(__dirname, "fonts", "Inter-Regular.ttf"), "Inter");
GlobalFonts.registerFromPath(join(__dirname, "fonts", "Inter-Bold.ttf"), "Inter");

const PORT = parseInt(process.env.PORT || "3001", 10);
const app = express();

const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";
app.use((_req, res, next) => {
  res.header("Access-Control-Allow-Origin", CORS_ORIGIN);
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  if (_req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }
  next();
});

app.use(express.json({ limit: "50mb" }));

const upload = multer({ dest: join(tmpdir(), "open-karaoke-uploads") });

// Check venv and demucs availability on startup
access(VENV_PYTHON)
  .then(() => {
    execFile(VENV_PYTHON, ["-m", "demucs", "--help"], (err) => {
      if (err) {
        console.error(
          "\n⚠️  Demucs is not installed in the virtual environment.\n" +
            "   Run: pnpm setup:demucs\n",
        );
      }
    });
  })
  .catch(() => {
    console.error(
      "\n⚠️  Python virtual environment not found.\n" +
        "   Run: pnpm setup:demucs\n",
    );
  });

// Check ffmpeg availability on startup
execFile("ffmpeg", ["-version"], (err) => {
  if (err) {
    console.error(
      "\n⚠️  ffmpeg is not installed. Install it with:\n" +
        "   brew install ffmpeg\n",
    );
  }
});

// ---------------------------------------------------------------------------
// Demucs vocal separation
// ---------------------------------------------------------------------------
async function runDemucs(
  inputPath: string,
  onProgress?: (pct: number) => void,
): Promise<string> {
  const outputDir = await mkdtemp(join(tmpdir(), "demucs-out-"));

  await new Promise<void>((resolve, reject) => {
    const proc = spawn(
      VENV_PYTHON,
      [
        "-m",
        "demucs",
        "--two-stems",
        "vocals",
        "-n",
        "htdemucs",
        "--shifts",
        "0",
        "--segment",
        "7",
        "-j",
        "4",
        "-o",
        outputDir,
        inputPath,
      ],
      {
        timeout: 600_000,
        env: { ...process.env, PYTHONWARNINGS: "ignore::UserWarning" },
      },
    );

    proc.stderr?.on("data", (data: Buffer) => {
      const text = data.toString();
      process.stderr.write(data);
      // Demucs outputs progress like "  1%|..." or " 95%|..."
      const match = text.match(/(\d+)%\|/);
      if (match && onProgress) {
        onProgress(parseInt(match[1], 10));
      }
    });

    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`demucs exited with code ${code}`));
    });
    proc.on("error", reject);
  });

  const modelDir = join(outputDir, "htdemucs");
  const entries = await readdir(modelDir);
  const songDir = entries[0];
  return join(modelDir, songDir, "no_vocals.wav");
}

// ---------------------------------------------------------------------------
// POST /api/export-video
// Accepts: multipart with "audio" file + "lyrics" JSON string + "syncMode" + "removeVocals"
// Returns: mp4 video file
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// GET /api/export-progress/:jobId
// Returns current progress for a running export job
// ---------------------------------------------------------------------------
app.get("/api/export-progress/:jobId", (req, res) => {
  const job = jobs.get(req.params.jobId);
  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }
  res.json({
    stage: job.stage,
    progress: job.progress,
    message: job.message,
  });
});

// ---------------------------------------------------------------------------
// GET /api/export-download/:jobId
// Downloads the completed video file
// ---------------------------------------------------------------------------
app.get("/api/export-download/:jobId", async (req, res) => {
  const job = jobs.get(req.params.jobId);
  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }
  if (job.stage !== "done" || !job.outputPath) {
    res.status(400).json({ error: "Job not ready for download" });
    return;
  }

  try {
    const { size } = await stat(job.outputPath);
    res.setHeader("Content-Type", "video/mp4");
    res.setHeader("Content-Length", size);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${job.filename}"`,
    );

    const stream = createReadStream(job.outputPath);
    stream.pipe(res);
    stream.on("error", (err) => {
      console.error("Stream error:", err);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to read output file" });
      } else {
        res.destroy();
      }
    });
  } catch (err) {
    console.error("Download error:", err);
    res.status(500).json({ error: "File not available" });
  }
});

// ---------------------------------------------------------------------------
// POST /api/export-video
// Accepts: multipart with "audio" file + "lyrics" JSON string + "syncMode" + "removeVocals"
// Returns: { jobId } immediately, then processes in background
// ---------------------------------------------------------------------------
app.post("/api/export-video", upload.single("audio"), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "No audio file uploaded" });
    return;
  }

  let lyrics: DrawLyrics;
  let syncMode: "line" | "word";
  let removeVocals: boolean;

  try {
    lyrics = JSON.parse(req.body.lyrics);
    syncMode = req.body.syncMode === "line" ? "line" : "word";
    removeVocals = req.body.removeVocals === "true";
  } catch {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const jobId = randomUUID();
  const filename = `${(lyrics.metadata.title || "karaoke").replace(/[^a-zA-Z0-9_-]/g, "_")}.mp4`;

  jobs.set(jobId, {
    stage: removeVocals ? "vocal-removal" : "encoding",
    progress: 0,
    message: removeVocals ? "Starting vocal removal..." : "Starting encoding...",
    tempDirs: [],
    inputAudioPath: req.file.path,
    filename,
  });

  // Return jobId immediately
  res.json({ jobId });

  // Process in background
  const job = jobs.get(jobId)!;
  const inputAudioPath = req.file.path;
  let audioPath = inputAudioPath;

  try {
    // Optional vocal removal
    if (removeVocals) {
      job.stage = "vocal-removal";
      job.progress = 0;
      job.message = "Removing vocals...";

      const instrumentalPath = await runDemucs(inputAudioPath, (pct) => {
        job.progress = pct;
        job.message = `Removing vocals... ${pct}%`;
      });
      audioPath = instrumentalPath;
      job.tempDirs.push(dirname(dirname(dirname(instrumentalPath))));
    }

    // Get audio duration via ffprobe
    const duration = await new Promise<number>((resolve, reject) => {
      execFile(
        "ffprobe",
        [
          "-v",
          "quiet",
          "-show_entries",
          "format=duration",
          "-of",
          "csv=p=0",
          audioPath,
        ],
        (err, stdout) => {
          if (err) reject(err);
          else resolve(parseFloat(stdout.trim()));
        },
      );
    });

    const durationMs = duration * 1000;

    if (durationMs > MAX_DURATION_MS) {
      job.stage = "error";
      job.progress = 0;
      job.message = `Audio exceeds the ${MAX_DURATION_MS / 60_000}-minute limit (${Math.round(duration)}s)`;
      scheduleJobCleanup(jobId);
      return;
    }

    const totalFrames = Math.ceil(duration * FPS);

    // Update to encoding stage
    job.stage = "encoding";
    job.progress = 0;
    job.message = "Starting encoding...";

    // Set up canvas
    const canvas = createCanvas(VIDEO_WIDTH, VIDEO_HEIGHT);
    const ctx = canvas.getContext("2d");

    // Spawn ffmpeg: pipe raw RGBA frames in, output mp4 with audio
    const outputDir = await mkdtemp(join(tmpdir(), "export-video-"));
    job.tempDirs.push(outputDir);
    const outputPath = join(outputDir, "output.mp4");

    const ffmpeg = spawn("ffmpeg", [
      "-y",
      "-f",
      "rawvideo",
      "-pix_fmt",
      "rgba",
      "-s",
      `${VIDEO_WIDTH}x${VIDEO_HEIGHT}`,
      "-r",
      String(FPS),
      "-i",
      "pipe:0",
      "-i",
      audioPath,
      "-c:v",
      "libx264",
      "-preset",
      "fast",
      "-crf",
      "23",
      "-pix_fmt",
      "yuv420p",
      "-c:a",
      "aac",
      "-b:a",
      "192k",
      "-shortest",
      "-movflags",
      "+faststart",
      outputPath,
    ]);

    let ffmpegError = "";
    ffmpeg.stderr.on("data", (data: Buffer) => {
      ffmpegError += data.toString();
    });

    const ffmpegDone = new Promise<void>((resolve, reject) => {
      ffmpeg.on("close", (code) => {
        if (code === 0) resolve();
        else
          reject(
            new Error(
              `ffmpeg exited with code ${code}: ${ffmpegError.slice(-500)}`,
            ),
          );
      });
      ffmpeg.on("error", reject);
    });

    // Render frames and pipe to ffmpeg
    console.log(`Encoding video: ${totalFrames} frames, ${duration.toFixed(1)}s audio`);
    const encodeStart = Date.now();
    let lastLog = encodeStart;

    for (let frame = 0; frame < totalFrames; frame++) {
      const currentTimeMs = (frame / FPS) * 1000;
      drawFrame(ctx, lyrics, syncMode, currentTimeMs);

      const buffer = canvas.data();
      const canWrite = ffmpeg.stdin.write(buffer);
      if (!canWrite) {
        await new Promise<void>((resolve) =>
          ffmpeg.stdin.once("drain", resolve),
        );
      }

      // Update progress
      const pct = Math.round((frame / totalFrames) * 100);
      job.progress = pct;
      job.message = `Encoding video... ${pct}%`;

      const now = Date.now();
      if (now - lastLog >= 5000) {
        const elapsed = ((now - encodeStart) / 1000).toFixed(1);
        const fps = (frame / ((now - encodeStart) / 1000)).toFixed(1);
        console.log(`Encoding: ${pct}% (${frame}/${totalFrames} frames, ${fps} fps, ${elapsed}s elapsed)`);
        lastLog = now;
      }
    }

    ffmpeg.stdin.end();
    await ffmpegDone;
    console.log(`Encoding complete in ${((Date.now() - encodeStart) / 1000).toFixed(1)}s`);

    job.stage = "done";
    job.progress = 100;
    job.message = "Export complete!";
    job.outputPath = outputPath;

    scheduleJobCleanup(jobId);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Export failed";
    console.error("Export error:", message);
    job.stage = "error";
    job.progress = 0;
    job.message = message;

    scheduleJobCleanup(jobId);
  }
});

app.listen(PORT, () => {
  console.log(`Open Karaoke server running on http://localhost:${PORT}`);
});
