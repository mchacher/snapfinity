import { useState } from 'react';
import { I18nProvider } from './i18n';
import { Workspace } from './features/workspace/Workspace';
import { Landing } from './features/landing/Landing';

export default function App() {
  // The landing shows on every visit (it's the product's front door); "Commencer" enters the
  // workspace, and the workspace logo brings you back here. No persistence by design.
  const [started, setStarted] = useState(false);

  return (
    <I18nProvider>
      {started ? <Workspace onHome={() => setStarted(false)} /> : <Landing onStart={() => setStarted(true)} />}
    </I18nProvider>
  );
}
