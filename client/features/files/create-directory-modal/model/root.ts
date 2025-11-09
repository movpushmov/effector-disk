import { createDialog } from '@client/shared/libs/dialogs';
import { notifications } from '@client/shared/libs/notifications';
import { createRequestEffect } from '@client/shared/libs/request-effect';
import type {
  ClientProblemKind,
  CreateDirectoryProblemKind,
  CreateDirectoryRequest,
  CreateDirectorySuccess,
  FileInfo,
  Result,
} from '@shared/api';
import { createFactory, invoke } from '@withease/factories';
import { createEvent, createStore, sample } from 'effector';
import { createAction } from 'effector-action';

export type CreateDirectoryModalModel = ReturnType<
  typeof createDirectoryModalFactory
>;

export const createDirectoryModalFactory = createFactory(() => {
  const notify = {
    success: notifications.info.prepend(() => 'Директория успешно создана'),
    internal: notifications.error.prepend(
      () => 'Что-то пошло не так, попробуйте ещё раз позже',
    ),
  };

  const createDirectoryFx = createRequestEffect<
    CreateDirectoryRequest,
    Result<
      CreateDirectorySuccess,
      CreateDirectoryProblemKind | ClientProblemKind
    >
  >(async ({ client, params }) => client.createDirectory(params));

  const dialog = invoke(() => createDialog<FileInfo | null>());

  const $name = createStore('');
  const $createPending = createDirectoryFx.pending;

  const nameChanged = createEvent<string>();
  const confirmPressed = createEvent();
  const cancelPressed = createEvent();

  const created = createEvent();
  const cancelled = createEvent<{ file: FileInfo | null }>();

  sample({
    clock: nameChanged,
    target: $name,
  });

  sample({
    clock: dialog.closed,
    fn: () => '',
    target: $name,
  });

  sample({
    clock: cancelPressed,
    source: { file: dialog.$params },
    target: cancelled,
  });

  sample({
    clock: confirmPressed,
    source: {
      name: $name,
      path: dialog.$params.map((params) => params?.path ?? null),
    },
    target: createDirectoryFx,
  });

  createAction({
    clock: createDirectoryFx.doneData,
    target: {
      created,
      ...notify,
    },
    fn: (target, result) => {
      if (!result.ok) {
        switch (result.error) {
          case 'TARGET_NOT_FOUND':
          case 'WRONG_TARGET':
          case 'NETWORK_ERROR':
          case 'PARSE_ERROR':
          case 'INVALID_REQUEST':
          case 'UNAUTHORIZED':
          case 'INTERNAL_SERVER_ERROR': {
            return target.internal();
          }
        }
      } else {
        target.created();
        target.success();
      }
    },
  });

  sample({
    clock: [cancelled, created],
    target: dialog.close,
  });

  return {
    dialog,

    created,
    cancelled,

    '@@unitShape': () => ({
      name: $name,
      createPending: $createPending,

      onNameChanged: nameChanged,
      onConfirmPressed: confirmPressed,
      onCancelPressed: cancelPressed,
    }),
  };
});
