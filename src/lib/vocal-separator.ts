import type { SyncedLyrics, SyncMode } from "../types/lyrics";

export type ExportStage =
  | "idle"
  | "uploading"
  | "vocal-removal"
  | "encoding"
  | "done"
  | "error";

export interface ExportProgress {
  stage: ExportStage;
  progress: number; // 0-100
  message: string;
}

interface ExportOptions {
  lyrics: SyncedLyrics;
  syncMode: SyncMode;
  audioUrl: string;
  removeVocals?: boolean;
  onProgress?: (progress: ExportProgress) => void;
  signal?: AbortSignal;
}

const POLL_INTERVAL = 2000;

export async function exportVideoServer({
  lyrics,
  syncMode,
  audioUrl,
  removeVocals = false,
  onProgress,
  signal,
}: ExportOptions): Promise<Blob> {
  onProgress?.({ stage: "uploading", progress: 0, message: "Uploading audio..." });

  // Fetch the audio blob from the blob/object URL
  const audioResponse = await fetch(audioUrl);
  const audioBlob = await audioResponse.blob();

  const formData = new FormData();
  formData.append("audio", audioBlob, "audio.wav");
  formData.append("lyrics", JSON.stringify(lyrics));
  formData.append("syncMode", syncMode);
  formData.append("removeVocals", String(removeVocals));

  const apiBase = import.meta.env.VITE_API_URL || "";
  const response = await fetch(`${apiBase}/api/export-video`, {
    method: "POST",
    body: formData,
    signal,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(
      (body as { error?: string }).error ||
        `Export failed (${response.status})`,
    );
  }

  const { jobId } = (await response.json()) as { jobId: string };

  // Poll for progress
  await new Promise<void>((resolve, reject) => {
    const poll = async () => {
      if (signal?.aborted) {
        reject(new DOMException("Aborted", "AbortError"));
        return;
      }

      try {
        const progressRes = await fetch(
          `${apiBase}/api/export-progress/${jobId}`,
          { signal },
        );
        if (!progressRes.ok) {
          reject(new Error("Failed to fetch progress"));
          return;
        }

        const data = (await progressRes.json()) as ExportProgress;
        onProgress?.(data);

        if (data.stage === "done") {
          resolve();
          return;
        }
        if (data.stage === "error") {
          reject(new Error(data.message || "Export failed"));
          return;
        }

        setTimeout(poll, POLL_INTERVAL);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          reject(err);
        } else {
          // Network error during poll — retry
          setTimeout(poll, POLL_INTERVAL);
        }
      }
    };

    poll();
  });

  // Download the finished file
  onProgress?.({ stage: "done", progress: 100, message: "Downloading..." });

  const downloadRes = await fetch(`${apiBase}/api/export-download/${jobId}`, {
    signal,
  });
  if (!downloadRes.ok) {
    throw new Error("Failed to download video");
  }

  const blob = await downloadRes.blob();
  onProgress?.({ stage: "done", progress: 100, message: "Export complete!" });
  return blob;
}
