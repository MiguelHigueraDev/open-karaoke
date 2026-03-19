import { STEP_LABELS, type Step } from '../../types/steps';
import { getSteps } from '../../state/step-machine';
import { useAppState } from '../../state/lyrics-context';

interface Props {
  currentStep: Step;
}

export function StepIndicator({ currentStep }: Props) {
  const { syncMode } = useAppState();
  const steps = getSteps(syncMode);
  const currentIdx = steps.indexOf(currentStep);

  return (
    <div className="flex items-center gap-2">
      {steps.map((step, i) => {
        const isCompleted = i < currentIdx;
        const isActive = i === currentIdx;

        return (
          <div key={step} className="flex items-center gap-1.5">
            {i > 0 && <div className="w-6 h-px bg-border mr-1" />}
            <div
              className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-semibold border-2 ${
                isCompleted
                  ? 'border-success text-success bg-success/10'
                  : isActive
                    ? 'border-accent text-accent bg-accent/10'
                    : 'border-border text-text-dim bg-transparent'
              }`}
            >
              {isCompleted ? '✓' : i + 1}
            </div>
            <span
              className={`text-xs ${
                isActive
                  ? 'text-text-primary'
                  : isCompleted
                    ? 'text-text-muted'
                    : 'text-text-dim'
              }`}
            >
              {STEP_LABELS[step]}
            </span>
          </div>
        );
      })}
    </div>
  );
}
