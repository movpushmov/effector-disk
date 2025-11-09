import { createRoutesView } from '@argon-router/react';
import { SignInRouteView } from './sign-in';
import { FilesRouteView } from './files';

export const Routes = createRoutesView({
  routes: [SignInRouteView, FilesRouteView],
});
