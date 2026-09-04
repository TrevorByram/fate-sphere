/**
 * Weighted random selection over the configured answers.
 *
 * Chances are treated as relative weights, so a config that totals 90 or 110
 * still behaves sensibly — each answer keeps its proportional share.
 *
 * @param {Array<{text: string, chance: number}>} answers
 * @param {() => number} random  Injectable RNG in [0, 1); defaults to Math.random.
 * @returns {{text: string, chance: number} | null}
 */
export function rollAnswer(answers, random = Math.random) {
  if (!Array.isArray(answers) || answers.length === 0) return null;

  const weighted = answers.filter((a) => Number.isFinite(a?.chance) && a.chance > 0);
  if (weighted.length === 0) return null;

  const total = weighted.reduce((sum, a) => sum + a.chance, 0);
  let threshold = random() * total;

  for (const answer of weighted) {
    threshold -= answer.chance;
    if (threshold < 0) return answer;
  }

  // Only reachable through floating-point drift at the very top of the range.
  return weighted[weighted.length - 1];
}
