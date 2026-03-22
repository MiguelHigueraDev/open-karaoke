import type { ReactNode } from 'react';
import { useAppState, useDispatch } from '../../state/lyrics-context';
import { canAdvance, nextStep, prevStep } from '../../state/step-machine';
import { StepIndicator } from './step-indicator';

interface Props {
  children: ReactNode;
  nextLabel?: string;
  onNext?: () => void;
}

export function StepShell({ children, nextLabel, onNext }: Props) {
  const state = useAppState();
  const dispatch = useDispatch();
  const prev = prevStep(state.step, state.syncMode);
  const next = nextStep(state.step, state.syncMode);
  const canGoNext = next && canAdvance(state.step, state.lyrics, state.syncMode);

  return (
    <div className="flex flex-col h-screen max-w-[1400px] mx-auto px-4 md:px-8">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between py-4 pb-3 border-b border-border gap-3">
        <h1 className="text-xl font-bold tracking-tight text-text-primary">
          Open Karaoke
        </h1>
        <StepIndicator currentStep={state.step} />
      </header>

      <main className="flex-1 overflow-y-auto py-8">{children}</main>

      <footer className="flex justify-between items-center py-4 border-t border-border">
        {prev ? (
          <button
            className="px-5 py-2.5 border border-border rounded-lg bg-transparent text-text-primary text-sm cursor-pointer transition-all hover:bg-bg-elevated hover:border-accent"
            onClick={() => dispatch({ type: 'GO_TO_STEP', step: prev })}
          >
            Back
          </button>
        ) : (
          <button
            className="px-4 py-2 text-xs border border-border rounded-lg bg-transparent text-text-muted cursor-pointer transition-all hover:bg-bg-elevated hover:border-accent hover:text-text-primary"
            onClick={() => dispatch({ type: 'SET_APP_MODE', mode: 'home' })}
          >
            Home
          </button>
        )}
        {next && (
          <button
            className="px-5 py-2.5 border border-accent rounded-lg bg-accent text-white text-sm font-semibold cursor-pointer transition-all hover:bg-accent-glow hover:border-accent-glow disabled:opacity-40 disabled:cursor-not-allowed"
            disabled={!canGoNext}
            onClick={() => {
              onNext?.();
              dispatch({ type: 'GO_TO_STEP', step: next });
            }}
          >
            {nextLabel ?? 'Next'}
          </button>
        )}
      </footer>
    </div>
  );
}
