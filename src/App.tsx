import { useState } from 'react';
import { I18nProvider } from './i18n';
import { Workspace } from './features/workspace/Workspace';
import { Landing } from './features/landing/Landing';

const SEEN_KEY = 'snapfinity.seenLanding';

export default function App() {
  // Show the landing on first visit; remember the choice so returning users go straight to work.
  const [started, setStarted] = useState(() => {
    try {
      return localStorage.getItem(SEEN_KEY) === '1';
    } catch {
      return false;
    }
  });
  const start = () => {
    try {
      localStorage.setItem(SEEN_KEY, '1');
    } catch {
      // ignore (private mode / storage disabled) — we just show the landing again next time
    }
    setStarted(true);
  };

  return (
    <I18nProvider>{started ? <Workspace /> : <Landing onStart={start} />}</I18nProvider>
  );
}
