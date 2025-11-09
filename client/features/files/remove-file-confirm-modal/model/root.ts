import { createDialog } from '@client/shared/libs/dialogs';
import { notifications } from '@client/shared/libs/notifications';
import { createRequestEffect } from '@client/shared/libs/request-effect';
import {
  ClientProblemKind,
  type DeleteFileRequest,
  DeleteProblemKind,
  type DeleteFileSuccess,
  type FileInfo,
  type Result,
} from '@shared/api';
import { createFactory, invoke } from '@withease/factories';
import { createEvent, sample } from 'effector';
import { createAction } from 'effector-action';

export type RemoveFileConfirmModalModel = ReturnType<
  typeof removeFileConfirmModalFactory
>;

export const removeFileConfirmModalFactory = createFactory(() => {
  const notify = {
    success: notifications.info.prepend(() => 'Файл успешно удалён'),
    notFound: notifications.error.prepend(() => 'Файл не найден'),
    internal: notifications.error.prepend(
      () => 'Что-то пошло не так, попробуйте ещё раз позже',
    ),
  };

  const removeFx = createRequestEffect<
    DeleteFileRequest,
    Result<DeleteFileSuccess, DeleteProblemKind | ClientProblemKind>
  >(async ({ client, params }) => client.deleteFile(params));

  const dialog = invoke(() => createDialog<FileInfo>());

  const $file = dialog.$params;

  const cancelPressed = createEvent();
  const removePressed = createEvent();

  const cancelled = createEvent();
  const removed = createEvent();

  sample({
    clock: removePressed,
    source: $file,
    fn: (file) => ({ id: file.id }),
    target: removeFx,
  });

  createAction({
    clock: removeFx.doneData,
    target: { removed, ...notify },
    fn: (target, result) => {
      if (!result.ok) {
        switch (result.error) {
          case 'FILE_NOT_FOUND': {
            return target.notFound();
          }
          case 'NETWORK_ERROR':
          case 'PARSE_ERROR':
          case 'INVALID_REQUEST':
          case 'UNAUTHORIZED':
          case 'INTERNAL_SERVER_ERROR': {
            return target.internal();
          }
        }
      } else {
        target.success();
        return target.removed();
      }
    },
  });

  sample({
    clock: [removed, cancelled],
    target: dialog.close,
  });

  return {
    dialog,
    removed,
    cancelled,

    '@@unitShape': () => ({
      file: $file,
      onCancelPressed: cancelPressed,
      onRemovePressed: removePressed,
    }),
  };
});
