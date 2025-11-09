import { createRoute } from '@argon-router/core';
import { authorizedGuardFx, notAuthorizedGuardFx } from './guards';
import { sample } from 'effector';

export const routes = {
  signIn: createRoute({ path: '/', beforeOpen: [notAuthorizedGuardFx] }),
  files: createRoute({
    path: '/files/:path?',
    beforeOpen: [authorizedGuardFx],
  }),
};

sample({
  clock: authorizedGuardFx.fail,
  fn: () => undefined,
  target: routes.signIn.open,
});

sample({
  clock: notAuthorizedGuardFx.fail,
  fn: () => ({ params: { path: undefined } }),
  target: routes.files.open,
});
