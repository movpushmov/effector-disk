import { createRouter } from '@argon-router/core';
import { routes } from './routes';

export const router = createRouter({
  routes: [routes.signIn, routes.files],
});
