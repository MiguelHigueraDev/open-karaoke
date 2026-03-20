// Re-export drawing utilities for the browser-side video preview.
// Actual video export is now handled server-side via POST /api/export-video.
export { drawFrame, VIDEO_WIDTH, VIDEO_HEIGHT, FPS } from '../../shared/draw-frame';
export type { DrawLyrics } from '../../shared/draw-frame';
