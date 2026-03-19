interface Props {
  isActive: boolean;
  isPast: boolean;
  /** 0–1 progress through the instrumental break. */
  progress: number;
  size?: 'normal' | 'large';
}

const DOT_COUNT = 3;
const DIM_OPACITY = 0.3;

const SCALE_BASE = 1; // resting size
const SCALE_AMP_MIN = 0.05; // subtle pulse at start
const SCALE_AMP_MAX = 0.5; // strong pulse near end

// Total phase = π + 2kπ ensures sin ends at peak.
// k=3 gives ~3.5 gentle cycles over the full break.
const TOTAL_PHASE = Math.PI + 6 * Math.PI; // 7π

export function InstrumentalDots({
  isActive,
  isPast,
  progress,
  size = 'normal',
}: Props) {
  const dotPx = size === 'large' ? 14 : 11;
  const gap = size === 'large' ? 'gap-3' : 'gap-2.5';
  const py = size === 'large' ? 'py-4' : 'py-3';

  const getDotOpacity = (i: number): number => {
    const segStart = i / DOT_COUNT;
    const segEnd = (i + 1) / DOT_COUNT;
    if (progress >= segEnd) return 1;
    if (progress <= segStart) return DIM_OPACITY;
    const t = (progress - segStart) / (segEnd - segStart);
    return DIM_OPACITY + t * (1 - DIM_OPACITY);
  };

  // Sine wave: 0 at progress=0, 1 at progress=1, oscillates in between
  const wave = (Math.sin(progress * TOTAL_PHASE - Math.PI / 2) + 1) / 2;

  // Amplitude ramps up with progress (ease-in)
  const amp = SCALE_AMP_MIN + progress * progress * (SCALE_AMP_MAX - SCALE_AMP_MIN);
  const scale = isActive ? SCALE_BASE + wave * amp : 1;

  return (
    <div className={`flex items-center justify-center ${gap} ${py}`}>
      {Array.from({ length: DOT_COUNT }, (_, i) => {
        const opacity = isActive
          ? getDotOpacity(i)
          : isPast
            ? 1
            : DIM_OPACITY;

        return (
          <span
            key={i}
            className="rounded-full bg-accent-glow"
            style={{
              width: dotPx,
              height: dotPx,
              opacity,
              transform: `scale(${scale})`,
              transition: 'opacity 0.15s ease',
            }}
          />
        );
      })}
    </div>
  );
}
