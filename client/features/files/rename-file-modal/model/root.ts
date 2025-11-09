import { createDialog } from '@client/shared/libs/dialogs';
import { notifications } from '@client/shared/libs/notifications';
import { createRequestEffect } from '@client/shared/libs/request-effect';
import {
  ClientProblemKind,
  type RenameFileRequest,
  RenameProblemKind,
  type FileInfo,
  type RenameFileSuccess,
  type Result,
} from '@shared/api';
import { createFactory, invoke } from '@withease/factories';
import { createEvent, createStore, sample } from 'effector';
import { createAction } from 'effector-action';

export type RenameFileModalModel = ReturnType<typeof renameFileModalFactory>;

export const renameFileModalFactory = createFactory(() => {
  const notify = {
    success: notifications.info.prepend(() => 'Файл успешно переименован'),
    notFound: notifications.error.prepend(() => 'Файл не найден'),
    internal: notifications.error.prepend(
      () => 'Что-то пошло не так, попробуйте ещё раз позже',
    ),
  };

  const renameFx = createRequestEffect<
    RenameFileRequest,
    Result<RenameFileSuccess, RenameProblemKind | ClientProblemKind>
  >(async ({ client, params }) => client.renameFile(params));

  const dialog = invoke(() => createDialog<FileInfo>());

  const $file = dialog.$params;
  const $name = createStore('');

  const fileRenamed = createEvent<{ file: FileInfo; newName: string }>();
  const cancelled = createEvent();

  const nameChanged = createEvent<string>();
  const renameFilePressed = createEvent();
  const cancelPressed = createEvent();

  sample({
    clock: $file,
    fn: (file) => file.filename,
    target: $name,
  });

  sample({
    clock: nameChanged,
    target: $name,
  });

  sample({
    clock: renameFilePressed,
    source: { file: $file, name: $name },
    fn: ({ file, name: newName }) => ({ id: file.id, newName }),
    target: renameFx,
  });

  sample({
    clock: cancelPressed,
    target: cancelled,
  });

  createAction({
    clock: renameFx.doneData,
    source: { file: $file, newName: $name },
    target: { fileRenamed, ...notify },
    fn: (target, { file, newName }, result) => {
      if (!result.ok) {
        switch (result.error) {
          case 'FILE_NOT_FOUND': {
            return target.notFound();
          }
          case 'INVALID_NAME':
          case 'NETWORK_ERROR':
          case 'PARSE_ERROR':
          case 'INVALID_REQUEST':
          case 'UPLOAD_ABORTED':
          case 'UNAUTHORIZED':
          case 'INTERNAL_SERVER_ERROR': {
            return target.internal();
          }
        }
      } else {
        target.success();
        return target.fileRenamed({ file, newName });
      }
    },
  });

  sample({
    clock: [fileRenamed, cancelled],
    target: dialog.close,
  });

  sample({
    clock: dialog.closed,
    target: $name.reinit,
  });

  return {
    dialog,

    fileRenamed,
    cancelled,

    '@@unitShape': () => ({
      file: $file,
      name: $name,
      onNameChanged: nameChanged,
      onRenameFilePressed: renameFilePressed,
      onCancelPressed: cancelPressed,
    }),
  };
});
