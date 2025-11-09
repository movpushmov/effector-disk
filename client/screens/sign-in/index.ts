import { createRouteView } from '@argon-router/react';
import { routes } from '@client/shared/routing';
import { SignInScreen } from './view';

export const SignInRouteView = createRouteView({
  route: routes.signIn,
  view: SignInScreen,
});
