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
  const prev = prevStep(state.step);
  const next = nextStep(state.step);
  const canGoNext = next && canAdvance(state.step, state.lyrics);

  return (
    <div className="flex flex-col h-screen max-w-[900px] mx-auto px-6">
      <header className="py-5 pb-4 border-b border-border">
        <h1 className="text-xl font-bold tracking-tight mb-4 text-text-primary">
          Open Lyrics
        </h1>
        <StepIndicator currentStep={state.step} />
      </header>

      <main className="flex-1 overflow-y-auto py-6">{children}</main>

      <footer className="flex justify-between items-center py-4 border-t border-border">
        {prev ? (
          <button
            className="px-5 py-2.5 border border-border rounded-lg bg-transparent text-text-primary text-sm cursor-pointer transition-all hover:bg-bg-elevated hover:border-accent"
            onClick={() => dispatch({ type: 'GO_TO_STEP', step: prev })}
          >
            Back
          </button>
        ) : (
          <div />
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
