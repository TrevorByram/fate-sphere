<h1 align="center">🎱 Fate Sphere</h1>

<p align="center">
  A configurable Fate Sphere for the web. Ask a question, shake the ball, get your answer.
</p>

<p align="center">
  <a href="https://github.com/TrevorByram/fate-sphere/actions/workflows/ci.yml">
    <img alt="CI status" src="https://github.com/TrevorByram/fate-sphere/actions/workflows/ci.yml/badge.svg">
  </a>
  <a href="LICENSE">
    <img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-blue.svg">
  </a>
  <img alt="React 18" src="https://img.shields.io/badge/react-18-61dafb.svg?logo=react&logoColor=white">
  <img alt="Vite 5" src="https://img.shields.io/badge/vite-5-646cff.svg?logo=vite&logoColor=white">
</p>

---

The answers and the odds of each one are driven by a config file you can edit
without touching a line of code — so you can retheme the whole thing, from
fortune teller to code-review oracle, by editing one JSON file.

## Contents

- [Quick start](#quick-start)
- [Scripts](#scripts)
- [Configuration](#configuration)
- [Responsive design](#responsive-design)
- [Deploying to AWS Amplify](#deploying-to-aws-amplify)
- [Tests](#tests)
- [Licensing](#licensing)

## Quick start

```bash
npm install
cp .env.example .env
npm run dev
```

The app runs at <http://localhost:5173>.

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm test` | Run the test suite once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with a coverage report |

## Configuration

There are two layers, and the split is deliberate.

### The header — environment variable

One env var controls the bold, centered heading at the top of the page:

```ini
VITE_SITE_HEADER="The Fate Sphere"
```

Locally it lives in `.env` (copy `.env.example`). On AWS Amplify, set it under
**App settings → Environment variables**. If it is unset or blank, the app falls
back to `The Fate Sphere`.

> [!NOTE]
> Vite bakes `VITE_*` variables into the bundle at build time, so changing the
> header requires a redeploy.

### The answers — config file

[`public/fate-sphere.config.json`](public/fate-sphere.config.json) defines
everything the ball can say. It is a **static asset fetched at runtime**, which
is what makes it Amplify-friendly: you can change the answers and redeploy
without rebuilding any application code.

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

| Field | Meaning |
| --- | --- |
| `initialAnswer` | Shown before the ball has ever been rolled. It does not have to appear in `answers`, and it can never be rolled. |
| `answers[].text` | The answer shown in the window. Keep it under ~24 characters. |
| `answers[].chance` | Percent chance of that answer. Values should total `100`. |
| `answers[].tone` | Optional styling hint: `positive` (green), `negative` (red), or `neutral` (white). Anything else is treated as `neutral`. |

#### Forgiving by design

The config is validated leniently, so a typo can never take the site down:

- A malformed or missing file falls back to the bundled defaults in
  [`src/config/defaultConfig.js`](src/config/defaultConfig.js).
- Answers with no text, or with an invalid or negative `chance`, are dropped.
- If the chances do not total 100, they are treated as **relative weights** and
  scaled proportionally, so the ball still behaves sensibly.
- Answers longer than ~24 characters truncate to three lines rather than
  spilling outside the ball.

Every correction is reported as a warning, shown on-screen in dev builds only.

## Responsive design

The layout is fluid rather than breakpoint-driven, and was verified in a real
browser from **320×568 up to 2560×1440**, including landscape phones (812×375)
and tablets. There is no horizontal page scroll at any tested size.

- The ball is sized as `clamp(13rem, min(80vw, 56vh), 34rem)` — constrained by
  the *smaller* viewport axis, so it fits short landscape screens and still
  fills a large monitor instead of sitting there as a marble.
- The answer text is sized in container query units (`cqi`) against the ball
  itself, not the viewport. This matters: sizing it in `vw` while the ball was
  bounded by `vh` let the two decouple, and the text clipped straight through
  the triangle on landscape phones.
- Headings, spacing, and the hint scale with `clamp()` on `vmin`, so nothing
  jumps at a breakpoint.

Both the shake and the drifting starfield honor `prefers-reduced-motion`, and
the ball is fully keyboard-operable with a live region announcing each result.

## Deploying to AWS Amplify

1. Connect the repository in the Amplify console.
2. Amplify picks up [`amplify.yml`](amplify.yml) automatically — it installs,
   runs the tests, builds, and publishes `dist/`.
3. Add `VITE_SITE_HEADER` under **App settings → Environment variables**.
4. For a single-page app, add a rewrite rule:

   | Setting | Value |
   | --- | --- |
   | Source | `</^[^.]+$\|\.(?!(css\|gif\|ico\|jpg\|js\|png\|txt\|svg\|woff2?\|json\|map)$)([^.]+$)/>` |
   | Target | `/index.html` |
   | Type | `200 (Rewrite)` |

## Tests

```bash
npm test
```

The suite covers the weighted-random selection (including bucket boundaries and
distribution), config normalization and every fallback path, the ball's roll and
shake behavior, keyboard accessibility, and the app's loading and error states.

Randomness is **injected rather than mocked globally** — `rollAnswer` and
`<FateSphere />` both accept a `random` function — so every outcome is asserted
deterministically.

CI runs the same suite plus a production build on every push and pull request
to `main`.

## Licensing

This project is [MIT licensed](LICENSE).

**Everything that ships to the browser is MIT.** The entire runtime dependency
tree is five packages — `react`, `react-dom`, `scheduler`, `loose-envify`, and
`js-tokens`.

The remaining dependencies are build and test tooling (Vite, Vitest, jsdom and
their transitive dependencies) that never reach your users. They are MIT, ISC,
BSD-2/3-Clause, Apache-2.0, BlueOak-1.0.0, MIT-0, and one CC-BY-4.0
(`caniuse-lite`, a browser-support database used at build time).

None of these licenses require payment or royalties, restrict commercial use,
restrict use in a public project, or impose copyleft obligations on your code.

> [!NOTE]
> MIT, BSD, and Apache-2.0 are permissive but not *attribution-free* — they ask
> that the copyright notice be preserved when you redistribute the software
> itself. Shipping a bundled web app is the ordinary, universally accepted use
> of these licenses and needs no visible credit on your site. `caniuse-lite`'s
> CC-BY-4.0 attribution clause covers its database, which this project consumes
> at build time and does not redistribute.
