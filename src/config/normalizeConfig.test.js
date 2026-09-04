import { describe, expect, it } from 'vitest';
import { normalizeConfig } from './normalizeConfig.js';
import { DEFAULT_CONFIG } from './defaultConfig.js';

const valid = {
  initialAnswer: { text: 'Ask away', tone: 'neutral' },
  answers: [
    { text: 'Yes', chance: 60, tone: 'positive' },
    { text: 'No', chance: 40, tone: 'negative' },
  ],
};

describe('normalizeConfig', () => {
  it('passes a valid config through unchanged and without warnings', () => {
    const result = normalizeConfig(valid);
    expect(result.initialAnswer).toEqual({ text: 'Ask away', tone: 'neutral' });
    expect(result.answers).toEqual(valid.answers);
    expect(result.warnings).toEqual([]);
  });

  it('falls back to defaults when the config is not an object', () => {
    for (const bad of [null, undefined, 'nope', 42, []]) {
      const result = normalizeConfig(bad);
      expect(result.answers).toEqual(DEFAULT_CONFIG.answers);
      expect(result.warnings.length).toBeGreaterThan(0);
    }
  });

  it('accepts a bare string as the initial answer', () => {
    const result = normalizeConfig({ ...valid, initialAnswer: '  Shake me  ' });
    expect(result.initialAnswer).toEqual({ text: 'Shake me', tone: 'neutral' });
  });

  it('warns and uses the default when the initial answer is unusable', () => {
    const result = normalizeConfig({ ...valid, initialAnswer: { text: '   ' } });
    expect(result.initialAnswer).toEqual(DEFAULT_CONFIG.initialAnswer);
    expect(result.warnings.join(' ')).toMatch(/initialAnswer/);
  });

  it('coerces an unknown tone to neutral', () => {
    const result = normalizeConfig({
      initialAnswer: { text: 'Hi', tone: 'chartreuse' },
      answers: [{ text: 'Yes', chance: 100, tone: 'sparkly' }],
    });
    expect(result.initialAnswer.tone).toBe('neutral');
    expect(result.answers[0].tone).toBe('neutral');
  });

  it('accepts plain strings as answers, defaulting their chance to 0', () => {
    const result = normalizeConfig({ ...valid, answers: ['Yes', 'No'] });
    // Both end up at chance 0, so the defaults take over.
    expect(result.answers).toEqual(DEFAULT_CONFIG.answers);
    expect(result.warnings.join(' ')).toMatch(/chance above zero/);
  });

  it('skips answers with no text and reports them', () => {
    const result = normalizeConfig({
      ...valid,
      answers: [{ text: '  ', chance: 50 }, { text: 'Yes', chance: 50 }],
    });
    expect(result.answers).toHaveLength(1);
    expect(result.warnings.join(' ')).toMatch(/Answer #1 has no text/);
  });

  it('coerces a numeric string chance', () => {
    const result = normalizeConfig({ ...valid, answers: [{ text: 'Yes', chance: '100' }] });
    expect(result.answers[0].chance).toBe(100);
    expect(result.warnings).toEqual([]);
  });

  it('defaults an invalid or negative chance to 0 with a warning', () => {
    const result = normalizeConfig({
      ...valid,
      answers: [
        { text: 'Bad', chance: 'lots' },
        { text: 'Worse', chance: -5 },
        { text: 'Good', chance: 100 },
      ],
    });
    expect(result.answers).toEqual([{ text: 'Good', chance: 100, tone: 'neutral' }]);
    expect(result.warnings.filter((w) => /valid "chance"/.test(w))).toHaveLength(2);
  });

  it('warns when the chances do not total 100 but keeps the answers', () => {
    const result = normalizeConfig({
      ...valid,
      answers: [{ text: 'Yes', chance: 30 }, { text: 'No', chance: 30 }],
    });
    expect(result.answers).toHaveLength(2);
    expect(result.warnings.join(' ')).toMatch(/total 60 instead of 100/);
  });

  it('does not warn about a total that is within floating-point tolerance', () => {
    const result = normalizeConfig({
      ...valid,
      answers: [
        { text: 'A', chance: 33.33 },
        { text: 'B', chance: 33.33 },
        { text: 'C', chance: 33.34 },
      ],
    });
    expect(result.warnings).toEqual([]);
  });

  it('falls back to default answers when "answers" is missing', () => {
    const result = normalizeConfig({ initialAnswer: { text: 'Hi' } });
    expect(result.answers).toEqual(DEFAULT_CONFIG.answers);
    expect(result.warnings.join(' ')).toMatch(/"answers" was missing/);
  });

  it('keeps a custom initial answer even when the answers fall back', () => {
    const result = normalizeConfig({ initialAnswer: { text: 'Custom start' }, answers: [] });
    expect(result.initialAnswer.text).toBe('Custom start');
    expect(result.answers).toEqual(DEFAULT_CONFIG.answers);
  });

  it('does not mutate the caller’s object', () => {
    const input = JSON.parse(JSON.stringify(valid));
    normalizeConfig(input);
    expect(input).toEqual(valid);
  });
});

describe('the shipped default config', () => {
  it('is itself valid and totals 100', () => {
    const result = normalizeConfig(DEFAULT_CONFIG);
    expect(result.warnings).toEqual([]);
    const total = result.answers.reduce((sum, a) => sum + a.chance, 0);
    expect(total).toBe(100);
  });
});
