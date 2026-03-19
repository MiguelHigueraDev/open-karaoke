import { STEP_ORDER, STEP_LABELS, type Step } from '../../types/steps';

interface Props {
  currentStep: Step;
}

export function StepIndicator({ currentStep }: Props) {
  const currentIdx = STEP_ORDER.indexOf(currentStep);

  return (
    <div className="flex items-center gap-2">
      {STEP_ORDER.map((step, i) => {
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
