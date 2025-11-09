import { createVirtualRoute } from '@argon-router/core';
import { createFactory } from '@withease/factories';
import { sample } from 'effector';

export const createDialog = createFactory(<T>() => {
  const route = createVirtualRoute<T, T>();

  sample({
    clock: route.closed,
    fn: () => null as T,
    target: route.$params,
  });

  return {
    $opened: route.$isOpened,
    $params: route.$params,

    open: route.open,
    opened: route.opened,

    close: route.close,
    closed: route.closed,

    '@@unitShape': () => ({
      opened: route.$isOpened,

      onOpen: route.open,
      onClose: route.close,
    }),
  };
});
