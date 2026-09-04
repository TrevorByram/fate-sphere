import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Vite rewrites import.meta.url under test, so resolve from the project root.
const css = readFileSync(resolve(process.cwd(), 'src/components/FateSphere.css'), 'utf8');

/** Pull one rule body out of the stylesheet by selector. */
const rule = (selector) => {
  const marker = `${selector} {`;
  const start = css.indexOf(marker);
  if (start === -1) throw new Error(`No rule found for ${selector}`);
  const open = start + marker.length;
  const close = css.indexOf('}', open);
  return css.slice(open, close);
};

/**
 * jsdom does not do layout, so these assert the responsive *strategy* rather
 * than pixel geometry. Actual containment across viewports was verified in a
 * real browser; this guards the regression that made the answer text clip on
 * landscape phones — sizing the font against the viewport instead of the ball.
 */
describe('FateSphere responsive strategy', () => {
  it('makes the ball a size container', () => {
    expect(rule('.fate-sphere')).toMatch(/container-type:\s*inline-size/);
  });

  it('sizes the answer text against the ball, not the viewport', () => {
    const answer = rule('.fate-sphere__answer');
    expect(answer).toMatch(/font-size:\s*[\d.]+cqi/);
    // A vw/vh-based font decouples the text from the ball and clips on
    // unusual aspect ratios, which is exactly the bug this guards.
    expect(answer).not.toMatch(/font-size:[^;]*\d(vw|vh|vmin|vmax)/);
  });

  it('bounds the ball at both ends so it fits phones and fills large screens', () => {
    const ball = rule('.fate-sphere');
    expect(ball).toMatch(/width:\s*clamp\(/);
    // Constrained by the smaller axis, so landscape phones stay on screen.
    expect(ball).toMatch(/min\(\s*\d+vw\s*,\s*\d+vh\s*\)/);
  });

  it('truncates over-long author text instead of letting it escape the ball', () => {
    const answer = rule('.fate-sphere__answer');
    expect(answer).toMatch(/line-clamp:\s*\d+/);
    expect(answer).toMatch(/overflow:\s*hidden/);
    expect(answer).toMatch(/overflow-wrap:\s*break-word/);
  });

  it('respects reduced-motion preferences', () => {
    expect(css).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  });
});
