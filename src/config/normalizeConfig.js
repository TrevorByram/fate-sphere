import { DEFAULT_CONFIG } from './defaultConfig.js';

export const VALID_TONES = ['positive', 'neutral', 'negative'];

const isPlainObject = (value) =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const toTone = (tone) => (VALID_TONES.includes(tone) ? tone : 'neutral');

const toText = (text) => (typeof text === 'string' ? text.trim() : '');

/**
 * Coerce a raw config (from JSON, an env var, or a hand-edit) into a shape the
 * app can rely on. Anything unusable is dropped and reported in `warnings`
 * rather than thrown, so a typo in the config never takes the site down.
 *
 * @param {unknown} raw
 * @returns {{ initialAnswer: {text: string, tone: string},
 *             answers: Array<{text: string, chance: number, tone: string}>,
 *             warnings: string[] }}
 */
export function normalizeConfig(raw) {
  const warnings = [];

  if (!isPlainObject(raw)) {
    warnings.push('Configuration was not an object; using the built-in defaults.');
    return { ...structuredCloneConfig(DEFAULT_CONFIG), warnings };
  }

  // --- initial answer -------------------------------------------------------
  let initialAnswer;
  if (isPlainObject(raw.initialAnswer) && toText(raw.initialAnswer.text)) {
    initialAnswer = {
      text: toText(raw.initialAnswer.text),
      tone: toTone(raw.initialAnswer.tone),
    };
  } else if (typeof raw.initialAnswer === 'string' && raw.initialAnswer.trim()) {
    initialAnswer = { text: raw.initialAnswer.trim(), tone: 'neutral' };
  } else {
    warnings.push('No usable "initialAnswer"; using the default starting message.');
    initialAnswer = { ...DEFAULT_CONFIG.initialAnswer };
  }

  // --- answers --------------------------------------------------------------
  const rawAnswers = Array.isArray(raw.answers) ? raw.answers : [];
  if (!Array.isArray(raw.answers)) {
    warnings.push('"answers" was missing or not an array; using the default answers.');
  }

  const answers = [];
  rawAnswers.forEach((entry, index) => {
    const text = isPlainObject(entry) ? toText(entry.text) : toText(entry);
    if (!text) {
      warnings.push(`Answer #${index + 1} has no text and was skipped.`);
      return;
    }

    const rawChance = isPlainObject(entry) ? entry.chance : undefined;
    let chance = typeof rawChance === 'number' ? rawChance : Number(rawChance);
    if (!Number.isFinite(chance) || chance < 0) {
      warnings.push(`Answer "${text}" has no valid "chance"; defaulting it to 0.`);
      chance = 0;
    }

    answers.push({ text, chance, tone: toTone(isPlainObject(entry) ? entry.tone : undefined) });
  });

  const usable = answers.filter((a) => a.chance > 0);
  if (usable.length === 0) {
    warnings.push('No answers with a chance above zero; using the default answers.');
    return {
      initialAnswer,
      answers: DEFAULT_CONFIG.answers.map((a) => ({ ...a })),
      warnings,
    };
  }

  const total = usable.reduce((sum, a) => sum + a.chance, 0);
  if (Math.abs(total - 100) > 0.01) {
    warnings.push(
      `Answer chances total ${round(total)} instead of 100; they were scaled proportionally.`,
    );
  }

  return { initialAnswer, answers: usable, warnings };
}

const round = (n) => Math.round(n * 100) / 100;

const structuredCloneConfig = (config) => ({
  initialAnswer: { ...config.initialAnswer },
  answers: config.answers.map((a) => ({ ...a })),
});
