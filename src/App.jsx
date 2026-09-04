import { useFateSphereConfig } from './hooks/useFateSphereConfig.js';
import { FateSphere } from './components/FateSphere.jsx';
import { StarField } from './components/StarField.jsx';
import './App.css';

const DEFAULT_HEADER = 'The Fate Sphere';

export function App() {
  const { config, status } = useFateSphereConfig();
  const header = import.meta.env?.VITE_SITE_HEADER?.trim() || DEFAULT_HEADER;

  return (
    <div className="app">
      <StarField />

      <main className="app__content">
        <h1 className="app__header">{header}</h1>

        {status === 'loading' ? (
          <p className="app__loading" data-testid="loading">Consulting the spirits…</p>
        ) : (
          <FateSphere initialAnswer={config.initialAnswer} answers={config.answers} />
        )}
      </main>

      {import.meta.env?.DEV && config?.warnings?.length > 0 && (
        <aside className="app__warnings" data-testid="config-warnings">
          <strong>Config warnings</strong>
          <ul>
            {config.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </aside>
      )}
    </div>
  );
}
