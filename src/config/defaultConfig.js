/**
 * Bundled fallback configuration.
 *
 * The app prefers `public/fate-sphere.config.json`, which is fetched at runtime so
 * it can be edited without touching code. This object is used only when that file
 * is missing or unreadable, so the ball always renders something sensible.
 */
export const DEFAULT_CONFIG = {
  initialAnswer: { text: 'Ask me anything', tone: 'neutral' },
  answers: [
    { text: 'It is certain', chance: 10, tone: 'positive' },
    { text: 'Without a doubt', chance: 10, tone: 'positive' },
    { text: 'Yes, definitely', chance: 10, tone: 'positive' },
    { text: 'You may rely on it', chance: 10, tone: 'positive' },
    { text: 'Most likely', chance: 10, tone: 'positive' },
    { text: 'Reply hazy, try again', chance: 10, tone: 'neutral' },
    { text: 'Ask again later', chance: 10, tone: 'neutral' },
    { text: 'Cannot predict now', chance: 10, tone: 'neutral' },
    { text: "Don't count on it", chance: 10, tone: 'negative' },
    { text: 'Very doubtful', chance: 10, tone: 'negative' },
  ],
};

export const CONFIG_URL = 'fate-sphere.config.json';
