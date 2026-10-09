// Prototype switch: by default NOTHING blocks a walkthrough — every form can be submitted as-is and
// the app fills sensible defaults. Turn strict mode on (add `?validate=1` to any URL) to get the real
// validation rules back. State-machine rules (e.g. you can't mail an unsigned letter) always apply.

let strict = false;
const listeners = new Set<() => void>();

export const isStrict = (): boolean => strict;

export function setStrict(value: boolean): void {
  if (strict === value) return;
  strict = value;
  listeners.forEach((l) => l());
}

export function subscribeStrict(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
