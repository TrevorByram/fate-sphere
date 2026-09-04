import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { App } from './App.jsx';
import { DEFAULT_CONFIG } from './config/defaultConfig.js';

const configPayload = {
  initialAnswer: { text: 'Give it a shake', tone: 'neutral' },
  answers: [{ text: 'Sure thing', chance: 100, tone: 'positive' }],
};

const mockFetchOnce = (payload, { ok = true, status = 200 } = {}) => {
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok,
    status,
    json: async () => payload,
  });
};

describe('<App />', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    mockFetchOnce(configPayload);
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('renders the header from the environment variable', async () => {
    vi.stubEnv('VITE_SITE_HEADER', 'Trevor’s Oracle');
    render(<App />);

    const heading = await screen.findByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('Trevor’s Oracle');
  });

  it('falls back to a default header when the env var is blank', async () => {
    vi.stubEnv('VITE_SITE_HEADER', '   ');
    render(<App />);

    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(
      'The Fate Sphere',
    );
  });

  it('shows a loading state before the config resolves', async () => {
    render(<App />);
    expect(screen.getByTestId('loading')).toBeInTheDocument();
    // Let the fetch settle so the state update stays inside act().
    await screen.findByTestId('fate-sphere');
  });

  it('requests the runtime config file', async () => {
    render(<App />);
    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalledTimes(1));
    expect(globalThis.fetch.mock.calls[0][0]).toMatch(/fate-sphere\.config\.json$/);
  });

  it('renders the ball with the fetched starting answer', async () => {
    render(<App />);
    expect(await screen.findByTestId('fate-sphere-answer')).toHaveTextContent('Give it a shake');
  });

  it('falls back to the bundled defaults when the fetch fails', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('offline'));
    render(<App />);

    expect(await screen.findByTestId('fate-sphere-answer')).toHaveTextContent(
      DEFAULT_CONFIG.initialAnswer.text,
    );
  });

  it('falls back to the bundled defaults on a non-OK response', async () => {
    mockFetchOnce(null, { ok: false, status: 404 });
    render(<App />);

    expect(await screen.findByTestId('fate-sphere-answer')).toHaveTextContent(
      DEFAULT_CONFIG.initialAnswer.text,
    );
  });

  it('falls back to the bundled defaults when the JSON is malformed', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => {
        throw new Error('Unexpected token');
      },
    });
    render(<App />);

    expect(await screen.findByTestId('fate-sphere-answer')).toHaveTextContent(
      DEFAULT_CONFIG.initialAnswer.text,
    );
  });

  it('renders the decorative background', async () => {
    render(<App />);
    expect(await screen.findByTestId('star-field')).toBeInTheDocument();
  });

  it('surfaces config warnings during development', async () => {
    mockFetchOnce({ initialAnswer: { text: 'Hi' }, answers: [{ text: 'Yes', chance: 20 }] });
    render(<App />);

    const warnings = await screen.findByTestId('config-warnings');
    expect(warnings).toHaveTextContent(/instead of 100/);
  });

  it('hides config warnings outside of development', async () => {
    vi.stubEnv('DEV', false);
    mockFetchOnce({ initialAnswer: { text: 'Hi' }, answers: [{ text: 'Yes', chance: 20 }] });
    render(<App />);

    await screen.findByTestId('fate-sphere');
    expect(screen.queryByTestId('config-warnings')).not.toBeInTheDocument();
  });
});
