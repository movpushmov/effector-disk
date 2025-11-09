import '@client/shared/global/index.css';
import '@mantine/core/styles.css';

import { hydrateRoot } from 'react-dom/client';
import { App } from '@client/app';
import { allSettled, fork, type Json } from 'effector';
import { router } from '@client/shared/routing';
import { createBrowserHistory } from 'history';
import { appStarted } from '@client/shared/global';

declare global {
  interface Window {
    __EFFECTOR_STATE__: Record<string, Json>;
  }
}

async function render() {
  const history = createBrowserHistory();
  const scope = fork({
    values: window.__EFFECTOR_STATE__,
  });

  await allSettled(router.setHistory, { scope, params: history });
  await allSettled(appStarted, { scope });

  hydrateRoot(
    document.getElementById('root') as HTMLElement,
    <App scope={scope} />,
  );
}

void render();
