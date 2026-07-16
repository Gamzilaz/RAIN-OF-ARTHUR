export function random(
  from: number | null = null,
  to: number | null = null,
  interpolation: ((n: number) => number) | null = null
): number {
  let low = 0;
  let high = 1;

  if (from === null) {
    low = 0;
    high = 1;
  } else if (to === null) {
    high = from;
    low = 0;
  } else {
    low = from;
    high = to;
  }

  const delta = high - low;

  if (interpolation === null) {
    interpolation = (n: number) => n;
  }
  return low + interpolation(Math.random()) * delta;
}

export function chance(c: number): boolean {
  return random() <= c;
}

export function times(n: number, f: (i: number) => void): void {
  for (let i = 0; i < n; i++) {
    f(i);
  }
}

export default times;
