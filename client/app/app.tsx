import { MantineProvider } from '@mantine/core';
import { RouterProvider } from '@argon-router/react';
import { Provider } from 'effector-react';
import { Routes } from '@client/screens';
import { router } from '@client/shared/routing';
import type { Scope } from 'effector';
import { Notifications } from '@mantine/notifications';

import '@client/shared/global/index.css';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/dropzone/styles.css';

interface Props {
  scope: Scope;
}

export function App({ scope }: Props) {
  return (
    <Provider value={scope}>
      <MantineProvider defaultColorScheme="dark">
        <Notifications position="bottom-center" limit={1} />
        <RouterProvider router={router}>
          <Routes />
        </RouterProvider>
      </MantineProvider>
    </Provider>
  );
}
