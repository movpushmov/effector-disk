import { App } from '@client/app';
import { createMemoryHistory } from 'history';
import { allSettled, fork, serialize } from 'effector';
import { router } from '@client/shared/routing';
import { appStarted } from '@client/shared/global';
import { renderToStaticMarkup } from 'react-dom/server';
import type { Request } from 'express';
import { $client } from './shared/api';
import { DiskApiClient } from './shared/api/client';
import { getProfileFx } from './shared/user';

interface RenderConfig {
  url: string;
  req: Request;
}

export async function render({ url, req }: RenderConfig) {
  const history = createMemoryHistory({ initialEntries: [url] });

  const scope = fork();

  const apiClient = new DiskApiClient();

  if (req.cookies.Authorization) {
    apiClient.setAuthToken(req.cookies.Authorization);
  }

  await allSettled($client, { scope, params: apiClient });
  await allSettled(getProfileFx, { scope, params: undefined });
  await allSettled(router.setHistory, { scope, params: history });
  await allSettled(appStarted, { scope });

  const app = (
    <>
      <App scope={scope} />
    </>
  );

  renderToStaticMarkup(app);

  const effector = serialize(scope);

  return {
    app,
    data: {
      effector,
    },
  };
}
