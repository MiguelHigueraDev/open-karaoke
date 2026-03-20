import type { SyncedLyrics, SyncMode } from "../types/lyrics";
import { Step, STEP_ORDER } from "../types/steps";

function getSteps(syncMode: SyncMode): Step[] {
  if (syncMode === "line") {
    return STEP_ORDER.filter((s) => s !== Step.WordSync);
  }
  return STEP_ORDER;
}

export function canAdvance(step: Step, lyrics: SyncedLyrics): boolean {
  switch (step) {
    case Step.Upload:
      return lyrics.lines.length > 0 && lyrics.metadata.duration > 0;
    case Step.LineSync:
      return lyrics.lines.every((l) => l.startTime !== null);
    case Step.WordSync:
      return lyrics.lines.every(
        (l) => l.isInstrumental || l.words.every((w) => w.startTime !== null),
      );
    case Step.Preview:
      return true;
    case Step.Export:
      return false; // last step
  }
}

export function nextStep(current: Step, syncMode: SyncMode): Step | null {
  const steps = getSteps(syncMode);
  const idx = steps.indexOf(current);
  return idx < steps.length - 1 ? steps[idx + 1] : null;
}

export function prevStep(current: Step, syncMode: SyncMode): Step | null {
  const steps = getSteps(syncMode);
  const idx = steps.indexOf(current);
  return idx > 0 ? steps[idx - 1] : null;
}

export { getSteps };
