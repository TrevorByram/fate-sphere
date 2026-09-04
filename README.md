# Fate Sphere

A configurable Fate Sphere built with React and Vite. Ask a question, click the
ball, get an answer — with the answer list and the odds of each answer driven by
a config file you can edit without touching code.

## Quick start

```bash
npm install
cp .env.example .env
npm run dev
```

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm test` | Run the test suite once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with a coverage report |
| `npm run licenses` | Audit the license of every installed package |

## Configuration

### The header (environment variable)

One env var controls the bold, centered heading at the top of the page:

```
VITE_SITE_HEADER="The Fate Sphere"
```

Locally it lives in `.env` (copy `.env.example`). On AWS Amplify, set it under
**App settings → Environment variables**. If it is unset or blank, the app falls
back to `The Fate Sphere`.

Note that Vite bakes `VITE_*` variables into the bundle at build time, so
changing it requires a redeploy.

### The answers (config file)

`public/fate-sphere.config.json` defines everything the ball can say. It is a
**static asset fetched at runtime**, which is what makes it Amplify-friendly:
you can change the answers and redeploy without rebuilding any application code,
and the file is directly editable in the deployed bundle.

```json
{
  "initialAnswer": {
    "text": "Ask me anything",
    "tone": "neutral"
  },
  "answers": [
    { "text": "It is certain", "chance": 60, "tone": "positive" },
    { "text": "Very doubtful", "chance": 40, "tone": "negative" }
  ]
}
```

- **`initialAnswer`** — shown before the ball has ever been rolled. It does not
  have to appear in `answers`, and it can never be rolled.
- **`answers[].text`** — the answer displayed in the window. Keep it under
  roughly 24 characters; longer text is truncated to three lines so it can never
  spill outside the ball.
- **`answers[].chance`** — the percent chance of that answer. Values across all
  answers should total `100`.
- **`answers[].tone`** — optional styling hint: `positive` (green), `negative`
  (red), or `neutral` (white). Anything else is treated as `neutral`.

The config is validated leniently so a typo can never take the site down:

- A malformed or missing file falls back to the bundled defaults in
  `src/config/defaultConfig.js`.
- Answers with no text, or with an invalid or negative `chance`, are dropped.
- If the chances do not total 100, they are treated as **relative weights** and
  scaled proportionally, so the ball still behaves sensibly.
- Every correction is reported as a warning, shown on-screen in dev builds only.

## Responsive design

The layout is fluid rather than breakpoint-driven, and was verified in a real
browser from 320x568 up to 2560x1440, including landscape phones (812x375) and
tablets.

- The ball is sized as `clamp(13rem, min(80vw, 56vh), 34rem)` — constrained by
  the *smaller* viewport axis, so it fits short landscape screens and still
  fills a large monitor instead of sitting there as a marble.
- The answer text is sized in container query units (`cqi`) against the ball
  itself, not the viewport. This matters: sizing it in `vw` while the ball was
  bounded by `vh` let the two decouple, and the text clipped straight through
  the triangle on landscape phones.
- Headings, spacing, and the hint scale with `clamp()` on `vmin`, so nothing
  jumps at a breakpoint.
- No horizontal page scroll at any tested size.

`FateSphere.responsive.test.js` guards the strategy — jsdom does not do layout,
so it asserts that the container-relative sizing stays in place rather than
re-measuring pixels.

## Deploying to AWS Amplify

1. Connect the repository in the Amplify console.
2. Amplify picks up `amplify.yml` automatically — it installs, runs the tests,
   builds, and publishes `dist/`.
3. Add `VITE_SITE_HEADER` under **App settings → Environment variables**.
4. For a single-page app, add a rewrite rule: source
   `</^[^.]+$|\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff2?|json|map)$)([^.]+$)/>`
   → target `/index.html`, type `200 (Rewrite)`.

## Tests

```bash
npm test
```

The suite covers the weighted-random selection (including bucket boundaries and
distribution), config normalization and every fallback path, the ball's roll and
shake behavior, keyboard accessibility, and the app's loading and error states.

Randomness is injected rather than mocked globally — `rollAnswer` and
`<FateSphere />` both accept a `random` function — so every outcome is asserted
deterministically.

## Licensing

This project is MIT licensed (see [LICENSE](LICENSE)).

Every dependency chosen directly is MIT. A fully MIT-only dependency *tree* is
not achievable on npm — transitive packages under ISC, BSD-2/3-Clause, and
Apache-2.0 are unavoidable — but all of those are permissive and compatible with
redistributing this project under MIT.

`npm run licenses` audits the full installed tree and fails if anything falls
outside the permissive allow-list. The script is dependency-free and part of
this repo, so the audit tooling is MIT too.

```
Scanned 227 installed packages.

   189  MIT
    18  ISC
     6  BSD-3-Clause
     5  Apache-2.0
     5  BlueOak-1.0.0
     2  BSD-2-Clause
     1  MIT-0
     1  CC-BY-4.0
```
