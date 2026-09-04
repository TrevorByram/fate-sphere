import { useEffect, useState } from 'react';
import { CONFIG_URL, DEFAULT_CONFIG } from '../config/defaultConfig.js';
import { normalizeConfig } from '../config/normalizeConfig.js';

/**
 * Fetches `public/fate-sphere.config.json` at runtime and normalizes it.
 *
 * Loading at runtime (rather than importing at build time) is what makes the
 * config Amplify-friendly: the JSON ships as a static asset and can be swapped
 * without rebuilding the bundle. If the fetch fails for any reason we fall back
 * to the bundled defaults so the ball still works.
 */
export function useFateSphereConfig() {
  const [state, setState] = useState({ config: null, status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    const base = import.meta.env?.BASE_URL ?? '/';
    const url = `${base}${base.endsWith('/') ? '' : '/'}${CONFIG_URL}`;

    async function load() {
      try {
        const response = await fetch(url, { cache: 'no-cache' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const raw = await response.json();
        if (!cancelled) setState({ config: normalizeConfig(raw), status: 'ready' });
      } catch (error) {
        if (cancelled) return;
        const fallback = normalizeConfig(DEFAULT_CONFIG);
        fallback.warnings = [
          `Could not load ${CONFIG_URL} (${error.message}); using built-in defaults.`,
        ];
        setState({ config: fallback, status: 'fallback' });
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
