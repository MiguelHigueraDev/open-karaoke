import {
  createContext,
  useContext,
  useReducer,
  type Dispatch,
  type ReactNode,
} from 'react';
import type { SyncedLyrics } from '../types/lyrics';
import { Step } from '../types/steps';
import { parseLyrics } from '../lib/parse-lyrics';

// ── State ──────────────────────────────────────────────────

export interface AppState {
  step: Step;
  audioFile: File | null;
  audioUrl: string | null;
  rawLyrics: string;
  lyrics: SyncedLyrics;
}

const INITIAL_LYRICS: SyncedLyrics = {
  metadata: { title: '', artist: '', duration: 0 },
  lines: [],
};

const INITIAL_STATE: AppState = {
  step: Step.Upload,
  audioFile: null,
  audioUrl: null,
  rawLyrics: '',
  lyrics: INITIAL_LYRICS,
};

// ── Actions ────────────────────────────────────────────────

export type Action =
  | { type: 'SET_AUDIO'; file: File; url: string; duration: number }
  | { type: 'SET_RAW_LYRICS'; text: string }
  | { type: 'SET_METADATA'; title: string; artist: string }
  | { type: 'GO_TO_STEP'; step: Step }
  | { type: 'SET_LINE_TIME'; lineIndex: number; time: number }
  | { type: 'UNDO_LINE_TIME' }
  | { type: 'FINALIZE_LINES'; duration: number }
  | { type: 'SET_WORD_TIME'; lineIndex: number; wordIndex: number; time: number }
  | { type: 'UNDO_WORD_TIME'; lineIndex: number }
  | { type: 'FINALIZE_WORDS'; lineIndex: number }
  | { type: 'RESET_LINE_SYNC'; lineIndex: number }
  | { type: 'RESET_WORD_SYNC'; lineIndex: number };

// ── Reducer ────────────────────────────────────────────────

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_AUDIO': {
      if (state.audioUrl) URL.revokeObjectURL(state.audioUrl);
      return {
        ...state,
        audioFile: action.file,
        audioUrl: action.url,
        lyrics: {
          ...state.lyrics,
          metadata: { ...state.lyrics.metadata, duration: action.duration },
        },
      };
    }

    case 'SET_RAW_LYRICS': {
      const lines = parseLyrics(action.text);
      return {
        ...state,
        rawLyrics: action.text,
        lyrics: { ...state.lyrics, lines },
      };
    }

    case 'SET_METADATA':
      return {
        ...state,
        lyrics: {
          ...state.lyrics,
          metadata: {
            ...state.lyrics.metadata,
            title: action.title,
            artist: action.artist,
          },
        },
      };

    case 'GO_TO_STEP':
      return { ...state, step: action.step };

    case 'SET_LINE_TIME': {
      const lines = state.lyrics.lines.map((line, i) => {
        if (i === action.lineIndex) {
          return { ...line, startTime: action.time };
        }
        // Set previous line's endTime
        if (i === action.lineIndex - 1 && line.endTime === null) {
          return { ...line, endTime: action.time };
        }
        return line;
      });
      return { ...state, lyrics: { ...state.lyrics, lines } };
    }

    case 'UNDO_LINE_TIME': {
      // Find the last synced line and clear it
      const lastSynced = [...state.lyrics.lines]
        .reverse()
        .findIndex((l) => l.startTime !== null);
      if (lastSynced === -1) return state;
      const idx = state.lyrics.lines.length - 1 - lastSynced;
      const lines = state.lyrics.lines.map((line, i) => {
        if (i === idx) return { ...line, startTime: null, endTime: null };
        if (i === idx - 1) return { ...line, endTime: null };
        return line;
      });
      return { ...state, lyrics: { ...state.lyrics, lines } };
    }

    case 'FINALIZE_LINES': {
      const lines = state.lyrics.lines.map((line, i, arr) => {
        const end =
          i < arr.length - 1
            ? arr[i + 1].startTime ?? action.duration
            : action.duration;
        return { ...line, endTime: end };
      });
      return { ...state, lyrics: { ...state.lyrics, lines } };
    }

    case 'SET_WORD_TIME': {
      const lines = state.lyrics.lines.map((line, li) => {
        if (li !== action.lineIndex) return line;
        const words = line.words.map((word, wi) => {
          if (wi === action.wordIndex) {
            return { ...word, startTime: action.time };
          }
          // Set previous word's endTime
          if (wi === action.wordIndex - 1 && word.endTime === null) {
            return { ...word, endTime: action.time };
          }
          return word;
        });
        return { ...line, words };
      });
      return { ...state, lyrics: { ...state.lyrics, lines } };
    }

    case 'UNDO_WORD_TIME': {
      const lines = state.lyrics.lines.map((line, li) => {
        if (li !== action.lineIndex) return line;
        const lastSynced = [...line.words]
          .reverse()
          .findIndex((w) => w.startTime !== null);
        if (lastSynced === -1) return line;
        const idx = line.words.length - 1 - lastSynced;
        const words = line.words.map((word, wi) => {
          if (wi === idx) return { ...word, startTime: null, endTime: null };
          if (wi === idx - 1) return { ...word, endTime: null };
          return word;
        });
        return { ...line, words };
      });
      return { ...state, lyrics: { ...state.lyrics, lines } };
    }

    case 'FINALIZE_WORDS': {
      const lines = state.lyrics.lines.map((line, li) => {
        if (li !== action.lineIndex) return line;
        const words = line.words.map((word, wi, arr) => {
          const end =
            wi < arr.length - 1
              ? arr[wi + 1].startTime ?? line.endTime
              : line.endTime;
          return { ...word, endTime: end };
        });
        return { ...line, words };
      });
      return { ...state, lyrics: { ...state.lyrics, lines } };
    }

    case 'RESET_LINE_SYNC': {
      const lines = state.lyrics.lines.map((line, i) => {
        if (i !== action.lineIndex) return line;
        return {
          ...line,
          startTime: null,
          endTime: null,
          words: line.words.map((w) => ({
            ...w,
            startTime: null,
            endTime: null,
          })),
        };
      });
      return { ...state, lyrics: { ...state.lyrics, lines } };
    }

    case 'RESET_WORD_SYNC': {
      const lines = state.lyrics.lines.map((line, li) => {
        if (li !== action.lineIndex) return line;
        const words = line.words.map((w) => ({
          ...w,
          startTime: null,
          endTime: null,
        }));
        return { ...line, words };
      });
      return { ...state, lyrics: { ...state.lyrics, lines } };
    }

    default:
      return state;
  }
}

// ── Context ────────────────────────────────────────────────

const StateCtx = createContext<AppState>(INITIAL_STATE);
const DispatchCtx = createContext<Dispatch<Action>>(() => {});

export function LyricsProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  return (
    <StateCtx.Provider value={state}>
      <DispatchCtx.Provider value={dispatch}>{children}</DispatchCtx.Provider>
    </StateCtx.Provider>
  );
}

export function useAppState() {
  return useContext(StateCtx);
}

export function useDispatch() {
  return useContext(DispatchCtx);
}
