export const Step = {
  Upload: 'upload',
  LineSync: 'line-sync',
  WordSync: 'word-sync',
  Preview: 'preview',
  Export: 'export',
} as const;

export type Step = (typeof Step)[keyof typeof Step];

export const STEP_ORDER: Step[] = [
  Step.Upload,
  Step.LineSync,
  Step.WordSync,
  Step.Preview,
  Step.Export,
];

export const STEP_LABELS: Record<Step, string> = {
  [Step.Upload]: 'Upload',
  [Step.LineSync]: 'Sync Lines',
  [Step.WordSync]: 'Sync Words',
  [Step.Preview]: 'Preview',
  [Step.Export]: 'Export',
};
