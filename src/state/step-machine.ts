import type { SyncedLyrics } from '../types/lyrics';
import { Step, STEP_ORDER } from '../types/steps';

export function canAdvance(step: Step, lyrics: SyncedLyrics): boolean {
  switch (step) {
    case Step.Upload:
      return lyrics.lines.length > 0 && lyrics.metadata.duration > 0;
    case Step.LineSync:
      return lyrics.lines.every((l) => l.startTime !== null);
    case Step.WordSync:
      return lyrics.lines.every((l) =>
        l.words.every((w) => w.startTime !== null),
      );
    case Step.Preview:
      return true;
    case Step.Export:
      return false; // last step
  }
}

export function nextStep(current: Step): Step | null {
  const idx = STEP_ORDER.indexOf(current);
  return idx < STEP_ORDER.length - 1 ? STEP_ORDER[idx + 1] : null;
}

export function prevStep(current: Step): Step | null {
  const idx = STEP_ORDER.indexOf(current);
  return idx > 0 ? STEP_ORDER[idx - 1] : null;
}
