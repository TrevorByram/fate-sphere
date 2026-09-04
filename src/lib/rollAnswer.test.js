import { describe, expect, it } from 'vitest';
import { rollAnswer } from './rollAnswer.js';

const answers = [
  { text: 'A', chance: 20 },
  { text: 'B', chance: 30 },
  { text: 'C', chance: 50 },
];

describe('rollAnswer', () => {
  it('returns null for an empty or invalid answer list', () => {
    expect(rollAnswer([])).toBeNull();
    expect(rollAnswer(null)).toBeNull();
    expect(rollAnswer(undefined)).toBeNull();
  });

  it('returns null when every answer has zero chance', () => {
    expect(rollAnswer([{ text: 'A', chance: 0 }])).toBeNull();
  });

  it('maps the bottom of the range to the first answer', () => {
    expect(rollAnswer(answers, () => 0).text).toBe('A');
  });

  it('maps the top of the range to the last answer', () => {
    expect(rollAnswer(answers, () => 0.999999).text).toBe('C');
  });

  it('respects the boundaries between weighted buckets', () => {
    // Cumulative bounds: A = [0, 20), B = [20, 50), C = [50, 100).
    expect(rollAnswer(answers, () => 0.19).text).toBe('A');
    expect(rollAnswer(answers, () => 0.2).text).toBe('B');
    expect(rollAnswer(answers, () => 0.49).text).toBe('B');
    expect(rollAnswer(answers, () => 0.5).text).toBe('C');
  });

  it('skips answers with a zero chance', () => {
    const withZero = [
      { text: 'never', chance: 0 },
      { text: 'always', chance: 100 },
    ];
    expect(rollAnswer(withZero, () => 0).text).toBe('always');
    expect(rollAnswer(withZero, () => 0.99).text).toBe('always');
  });

  it('treats chances as relative weights when they do not total 100', () => {
    const uneven = [
      { text: 'A', chance: 1 },
      { text: 'B', chance: 3 },
    ];
    expect(rollAnswer(uneven, () => 0.24).text).toBe('A');
    expect(rollAnswer(uneven, () => 0.26).text).toBe('B');
  });

  it('produces a distribution close to the configured percentages', () => {
    const counts = { A: 0, B: 0, C: 0 };
    const iterations = 60000;
    // Deterministic sweep across the whole range instead of a real RNG.
    for (let i = 0; i < iterations; i += 1) {
      counts[rollAnswer(answers, () => i / iterations).text] += 1;
    }
    expect(counts.A / iterations).toBeCloseTo(0.2, 2);
    expect(counts.B / iterations).toBeCloseTo(0.3, 2);
    expect(counts.C / iterations).toBeCloseTo(0.5, 2);
  });

  it('falls back to the last answer if the RNG returns exactly 1', () => {
    // Guards the floating-point drift branch: random() should be < 1, but a
    // faulty source returning 1 must still yield a valid answer, not undefined.
    expect(rollAnswer(answers, () => 1).text).toBe('C');
  });

  it('never returns an answer that is not in the list', () => {
    for (let i = 0; i < 500; i += 1) {
      expect(answers).toContain(rollAnswer(answers));
    }
  });
});
