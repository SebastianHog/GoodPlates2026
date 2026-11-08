// A step that starts with "Note:" or "Tip:" is an aside to the step before it, not something to do:
// it gets no number or checkbox and isn't counted as a step
export function isStepNote(step: string): boolean {
  return /^(note|tip)\s*:/i.test(step.trim());
}
