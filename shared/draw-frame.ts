// Shared frame-drawing logic used by both browser preview and server-side export.
// Uses only standard Canvas 2D API — compatible with both DOM canvas and node-canvas.

export interface DrawLyrics {
  metadata: { title: string; artist: string };
  lines: DrawLine[];
}

export interface DrawLine {
  isInstrumental: boolean;
  startTime: number | null;
  endTime: number | null;
  words: DrawWord[];
}

export interface DrawWord {
  text: string;
  startTime: number | null;
  endTime: number | null;
}

export const VIDEO_WIDTH = 1920;
export const VIDEO_HEIGHT = 1080;
export const FPS = 30;

const WIDTH = VIDEO_WIDTH;
const HEIGHT = VIDEO_HEIGHT;

// Colors matching the app theme
const COLOR_BG = '#0f0f14';
const COLOR_ACCENT_GLOW = '#a78bfa';
const COLOR_TEXT_DIM = '#555570';
const COLOR_TEXT_MUTED = '#8888a0';

// Font
const FONT_FAMILY = 'Inter, system-ui, -apple-system, sans-serif';

// Dot constants (matching instrumental-dots.tsx)
const DOT_COUNT = 3;
const DIM_OPACITY = 0.3;
const SCALE_BASE = 1;
const SCALE_AMP_MIN = 0.05;
const SCALE_AMP_MAX = 0.5;
const TOTAL_PHASE = Math.PI + 6 * Math.PI; // 7π

type SyncMode = 'line' | 'word';

// Use a generic context type so both browser CanvasRenderingContext2D and
// node-canvas's CanvasRenderingContext2D are accepted.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Ctx = any;

export function drawFrame(
  ctx: Ctx,
  lyrics: DrawLyrics,
  syncMode: SyncMode,
  currentTime: number,
) {
  // Clear background
  ctx.fillStyle = COLOR_BG;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Find active line
  const activeLineIdx = lyrics.lines.findIndex(
    (l: DrawLine) =>
      l.startTime !== null &&
      l.endTime !== null &&
      currentTime >= l.startTime &&
      currentTime < l.endTime,
  );

  // Compute visible window
  const windowStart = Math.max(0, activeLineIdx - 1);
  const windowEnd = Math.min(lyrics.lines.length, activeLineIdx + 3);
  const visibleLines = lyrics.lines.slice(
    Math.max(windowStart, 0),
    Math.max(windowEnd, Math.min(4, lyrics.lines.length)),
  );

  // Layout lines centered vertically
  const lineHeight = 80;
  const totalHeight = visibleLines.length * lineHeight;
  let y = (HEIGHT - totalHeight) / 2 + lineHeight / 2;

  for (const line of visibleLines) {
    const isActive =
      line.startTime !== null &&
      line.endTime !== null &&
      currentTime >= line.startTime &&
      currentTime < line.endTime;

    const isPast = line.endTime !== null && currentTime >= line.endTime;

    if (line.isInstrumental) {
      drawInstrumentalDots(ctx, y, isActive, isPast, currentTime, line);
    } else if (syncMode === 'line') {
      drawLineModeText(ctx, line, y, isActive, isPast);
    } else {
      drawWordModeText(ctx, line, y, isActive, isPast, currentTime);
    }

    y += lineHeight;
  }

  // Draw metadata at bottom
  ctx.fillStyle = COLOR_TEXT_DIM;
  ctx.font = `20px ${FONT_FAMILY}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  const meta = [lyrics.metadata.title, lyrics.metadata.artist]
    .filter(Boolean)
    .join(' \u2014 ');
  if (meta) {
    ctx.fillText(meta, WIDTH / 2, HEIGHT - 40);
  }
}

function drawLineModeText(
  ctx: Ctx,
  line: { words: { text: string }[] },
  y: number,
  isActive: boolean,
  isPast: boolean,
) {
  const text = line.words.map((w) => w.text).join(' ');
  const fontSize = isActive ? 48 : 32;

  ctx.font = `${isActive ? 'bold' : 'normal'} ${fontSize}px ${FONT_FAMILY}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = isActive
    ? COLOR_ACCENT_GLOW
    : isPast
      ? COLOR_TEXT_MUTED
      : COLOR_TEXT_DIM;

  ctx.fillText(text, WIDTH / 2, y);
}

function drawWordModeText(
  ctx: Ctx,
  line: {
    words: {
      text: string;
      startTime: number | null;
      endTime: number | null;
    }[];
  },
  y: number,
  isActive: boolean,
  _isPast: boolean,
  currentTime: number,
) {
  const fontSize = isActive ? 48 : 32;
  ctx.font = `${isActive ? 'bold' : 'normal'} ${fontSize}px ${FONT_FAMILY}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';

  const spacing = fontSize * 0.35;

  // Measure total width
  const wordWidths = line.words.map(
    (w) => ctx.measureText(w.text).width as number,
  );
  const totalWidth =
    wordWidths.reduce((a: number, b: number) => a + b, 0) +
    spacing * (line.words.length - 1);
  let x = (WIDTH - totalWidth) / 2;

  for (let i = 0; i < line.words.length; i++) {
    const word = line.words[i];
    const wordWidth = wordWidths[i];

    const wordStart = word.startTime ?? 0;
    const wordEnd = word.endTime ?? wordStart;
    const wordDuration = wordEnd - wordStart;

    let wordProgress = 0;
    if (currentTime >= wordEnd) wordProgress = 1;
    else if (currentTime > wordStart && wordDuration > 0)
      wordProgress = (currentTime - wordStart) / wordDuration;

    // Settle offset
    const maxOffset = 4;
    const t = Math.min(wordProgress, 1);
    const eased = 1 - (1 - t) ** 3;
    const offsetY = wordProgress >= 1 ? 0 : maxOffset * (1 - eased);

    const wordY = y + offsetY;

    if (wordProgress > 0 && wordProgress < 1) {
      const splitX = x + wordWidth * wordProgress;
      const clipTop = wordY - fontSize;
      const clipHeight = fontSize * 2;

      ctx.save();
      ctx.beginPath();
      ctx.rect(x - 1, clipTop, splitX - x + 1, clipHeight);
      ctx.clip();
      ctx.fillStyle = COLOR_ACCENT_GLOW;
      ctx.fillText(word.text, x, wordY);
      ctx.restore();

      ctx.save();
      ctx.beginPath();
      ctx.rect(
        splitX,
        clipTop,
        wordWidth - wordWidth * wordProgress + 1,
        clipHeight,
      );
      ctx.clip();
      ctx.fillStyle = COLOR_TEXT_DIM;
      ctx.fillText(word.text, x, wordY);
      ctx.restore();
    } else {
      ctx.fillStyle = wordProgress >= 1 ? COLOR_ACCENT_GLOW : COLOR_TEXT_DIM;
      ctx.fillText(word.text, x, wordY);
    }

    x += wordWidth + spacing;
  }
}

function drawInstrumentalDots(
  ctx: Ctx,
  y: number,
  isActive: boolean,
  isPast: boolean,
  currentTime: number,
  line: { startTime: number | null; endTime: number | null },
) {
  const s = line.startTime ?? 0;
  const e = line.endTime ?? s;
  const d = e - s;
  let progress = 0;
  if (d > 0) {
    if (currentTime >= e) progress = 1;
    else if (currentTime > s) progress = (currentTime - s) / d;
  }

  const dotRadius = 7;
  const gap = 28;
  const startX = WIDTH / 2 - ((DOT_COUNT - 1) * gap) / 2;

  const wave = (Math.sin(progress * TOTAL_PHASE - Math.PI / 2) + 1) / 2;
  const amp =
    SCALE_AMP_MIN + progress * progress * (SCALE_AMP_MAX - SCALE_AMP_MIN);
  const scale = isActive ? SCALE_BASE + wave * amp : 1;

  for (let i = 0; i < DOT_COUNT; i++) {
    const segStart = i / DOT_COUNT;
    const segEnd = (i + 1) / DOT_COUNT;
    let opacity: number;
    if (isActive) {
      if (progress >= segEnd) opacity = 1;
      else if (progress <= segStart) opacity = DIM_OPACITY;
      else {
        const t = (progress - segStart) / (segEnd - segStart);
        opacity = DIM_OPACITY + t * (1 - DIM_OPACITY);
      }
    } else {
      opacity = isPast ? 1 : DIM_OPACITY;
    }

    const cx = startX + i * gap;
    const r = dotRadius * scale;

    ctx.beginPath();
    ctx.arc(cx, y, r, 0, Math.PI * 2);
    ctx.globalAlpha = opacity;
    ctx.fillStyle = COLOR_ACCENT_GLOW;
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}
