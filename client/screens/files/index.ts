import { createRouteView } from '@argon-router/react';
import { routes } from '@client/shared/routing';
import { FilesScreen } from './view';
import { MainLayout } from '@client/layouts/main';

export const FilesRouteView = createRouteView({
  layout: MainLayout,
  route: routes.files,
  view: FilesScreen,
});
