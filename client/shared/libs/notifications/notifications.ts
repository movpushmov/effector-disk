import { type MantineTheme, type NotificationProps } from '@mantine/core';
import {
  cleanNotifications,
  showNotification,
  type NotificationData,
} from '@mantine/notifications';
import { createEffect, createEvent, sample } from 'effector';

const getStyleProps = (theme: MantineTheme) => ({
  body: {
    marginLeft: 4,
  },

  root: {
    backgroundColor: theme.colors.dark[5],
    padding: 12,
  },

  title: {
    fontSize: 16,
    marginBottom: 1,
  },

  description: {
    display: 'none',
  },

  closeButton: {
    scale: 1.2,
  },
});

function factory(baseProps: Omit<NotificationData, 'message'> = {}) {
  const event = createEvent<string>();

  const getBaseStyles = (
    theme: MantineTheme,
    props: NotificationProps,
    ctx: unknown,
  ) => {
    return typeof baseProps.styles === 'function'
      ? baseProps.styles(theme, props, ctx)
      : baseProps.styles;
  };

  sample({
    clock: event,
    target: createEffect((message: string) => {
      cleanNotifications();

      showNotification({
        color: 'white',
        message: '',
        radius: 'lg',
        ...baseProps,

        title: message,

        styles: (theme, props, ctx) => ({
          ...getStyleProps(theme),
          ...getBaseStyles(theme, props, ctx),
        }),
      });
    }),
  });

  return event;
}

const hide = createEvent();

sample({
  clock: hide,
  target: createEffect(cleanNotifications),
});

const info = factory();

const error = factory({
  color: '#fa5252',
});

const loading = factory({
  loading: true,
  autoClose: false,

  styles: {
    loader: {
      '--loader-size': '24px',
    },
  },
});

export const notifications = {
  info,
  error,
  loading,
  hide,
};
