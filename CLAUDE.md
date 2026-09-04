# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev            # dev server on :5173
npm run build          # production build to dist/
npm test               # run the suite once
npm run test:watch     # watch mode
npm run test:coverage  # coverage report
```

Run a single file or test:

```bash
npx vitest run src/lib/rollAnswer.test.js
npx vitest run -t "respects the boundaries between weighted buckets"
```

## Two-layer configuration

The app is configured in two places, and the split is deliberate:

- **`VITE_SITE_HEADER`** (env var, `.env` locally / Amplify console in prod) sets
  the page heading. Vite inlines `VITE_*` at **build time**, so changing it
  requires a rebuild.
- **`public/fate-sphere.config.json`** holds the answers, their percent odds, and
  the separate pre-roll `initialAnswer`. It is fetched at **runtime** by
  `useFateSphereConfig`, deliberately *not* imported, so the answers can change on
  AWS Amplify without rebuilding application code.

Do not convert the JSON to a static import — that would silently break the
runtime-editability the deployment model depends on.

## Config normalization contract

`src/config/normalizeConfig.js` never throws. Bad input is coerced or dropped
and reported in a `warnings` array, falling back to `src/config/defaultConfig.js`
so a typo in the JSON can never take the site down. Warnings render on-screen in
dev builds only. Preserve this behavior when touching config handling.

Chances are treated as **relative weights**, not strict percentages — a list
totaling 90 or 110 still behaves sensibly. `rollAnswer` and `normalizeConfig`
both rely on this.

## Testing conventions

- **Randomness is injected, never globally mocked.** `rollAnswer(answers, random)`
  and `<FateSphere random={...} />` both accept an RNG, so every outcome is
  asserted deterministically. Keep that seam open.
- **Do not reintroduce `@testing-library/user-event`.** It was removed because it
  deadlocks against the fake timers the shake animation requires. Drive the
  component with `fireEvent` wrapped in `act()`.
- `import.meta.url` is rewritten under Vitest; resolve file paths from
  `process.cwd()` instead (see `FateSphere.responsive.test.js`).

## Responsive sizing

The answer text is sized in **container query units (`cqi`) against the ball**,
which declares `container-type: inline-size`. This is load-bearing: sizing the
font in `vw` while the ball is bounded by `vh` lets the two decouple on unusual
aspect ratios, and the text clips through the triangle on landscape phones. That
was a real shipped bug — `FateSphere.responsive.test.js` guards against it.

jsdom does not compute layout, so that test asserts the *strategy* (container
units, clamps, line-clamp present) rather than measuring pixels. Real layout
changes still need verification in a browser across viewports; the working range
was checked from 320x568 to 2560x1440 including landscape.

Answer strings should stay under ~24 characters; longer text truncates to three
lines rather than escaping the ball.

## Licensing constraint

This is a public repo intended to stay MIT-clean. Everything shipped to the
browser is MIT — the runtime tree is only `react`, `react-dom`, `scheduler`,
`loose-envify`, `js-tokens`. **Prefer MIT for any new direct dependency**, and
keep non-MIT additions to devDependencies where they never reach users. No
current dependency requires payment, restricts commercial use, or imposes
copyleft.
