import { I18nProvider } from './i18n';
import { Workspace } from './features/workspace/Workspace';

export default function App() {
  return (
    <I18nProvider>
      <Workspace />
    </I18nProvider>
  );
}
