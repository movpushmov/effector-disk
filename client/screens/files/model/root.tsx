import { createDirectoryModalFactory } from '@client/features/files/create-directory-modal';
import { filePreviewModalFactory } from '@client/features/files/file-preview-modal';
import { removeFileConfirmModalFactory } from '@client/features/files/remove-file-confirm-modal';
import { renameFileModalFactory } from '@client/features/files/rename-file-modal';
import { uploadFilesDialogFactory } from '@client/features/files/upload-files-dialog';
import { createContextMenu } from '@client/shared/libs/context-menu';
import { notifications } from '@client/shared/libs/notifications';
import { createRequestEffect } from '@client/shared/libs/request-effect';
import { routes } from '@client/shared/routing';
import { MenuItem } from '@mantine/core';
import {
  ClientProblemKind,
  GetFilesProblemKind,
  type FileInfo,
  type GetFilesRequest,
  type GetFilesSuccess,
  type Result,
} from '@shared/api';
import { IconFolder, IconPencil, IconTrash } from '@tabler/icons-react';
import { invoke } from '@withease/factories';
import { createEvent, createStore, sample } from 'effector';
import { createAction } from 'effector-action';

const notify = {
  notADir: notifications.error.prepend(() => 'Файл не является директорией'),
  notFound: notifications.error.prepend(() => 'Директория не найдена'),
  internal: notifications.error.prepend(
    () => 'Что-то пошло не так, попробуйте ещё раз позже',
  ),
};

export const getFilesFx = createRequestEffect<
  GetFilesRequest,
  Result<GetFilesSuccess, GetFilesProblemKind | ClientProblemKind>
>(async ({ client, params }) => client.getFiles(params));

export const $currentFile = createStore<FileInfo | null>(null);
export const $files = createStore<FileInfo[]>([]);

export const $breadcrumbs = $currentFile.map((file) => {
  if (!file) {
    return [{ name: 'Файлы', path: undefined }];
  }

  const splittedPath = file.path.split('/');
  const lastIndex = splittedPath.length - 1;

  return splittedPath.slice(0, lastIndex).map((breadcrumb, index) => {
    if (!breadcrumb) {
      return { name: 'Файлы', path: undefined };
    }

    const path = splittedPath.slice(0, index + 1).join('/');

    return { name: breadcrumb, path: encodeURIComponent(path) };
  });
});

export const $filesPending = getFilesFx.pending;

export const renamePressed = createEvent<FileInfo>();
export const removePressed = createEvent<FileInfo>();
export const createDirectoryPressed = createEvent();

export const goBackPressed = createEvent();
export const filePressed = createEvent<FileInfo>();
export const downloadPressed = createEvent<FileInfo>();
export const filesDropped = createEvent<File[]>();

export const createDirectoryModal = invoke(createDirectoryModalFactory);
export const renameFileModal = invoke(renameFileModalFactory);
export const removeFileConfirmModal = invoke(removeFileConfirmModalFactory);
export const uploadFilesDialog = invoke(uploadFilesDialogFactory);
export const filePreviewModal = invoke(filePreviewModalFactory, {
  removePressed,
});

export const uploadFiles = uploadFilesDialog.uploadFiles;

export const openFilePreview = createEvent<FileInfo>();

export const listContextMenu = invoke(() =>
  createContextMenu({
    items: [
      ({ onCreateDirectoryPressed }) => (
        <MenuItem
          leftSection={<IconFolder />}
          onClick={onCreateDirectoryPressed}
        >
          Новая папка
        </MenuItem>
      ),
    ],
    shape: { onCreateDirectoryPressed: createDirectoryPressed },
  }),
);

export const fileContextMenu = invoke(() =>
  createContextMenu({
    items: [
      ({ onRenamePressed, payload }) => (
        <MenuItem
          leftSection={<IconPencil />}
          onClick={() => onRenamePressed(payload as FileInfo)}
        >
          Переименовать
        </MenuItem>
      ),
      ({ onRemovePressed, payload }) => (
        <MenuItem
          leftSection={<IconTrash />}
          onClick={() => onRemovePressed(payload as FileInfo)}
        >
          Удалить файл
        </MenuItem>
      ),
    ],
    shape: {
      onRenamePressed: renamePressed,
      onRemovePressed: removePressed,
    },
  }),
);

sample({
  clock: routes.files.opened,
  fn: ({ params: { path } }) => ({ path }),
  target: getFilesFx,
});

createAction({
  clock: getFilesFx.doneData,
  target: {
    $currentFile,
    $files,
    ...notify,
  },
  fn: (target, result) => {
    if (!result.ok) {
      switch (result.error) {
        case 'DIR_NOT_FOUND': {
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
      target.$currentFile(result.data.currentFile);
      target.$files(result.data.files);
    }
  },
});

createAction({
  clock: filePressed,
  target: {
    openFiles: routes.files.open,
    openFilePreview,
  },
  fn: (target, file) => {
    switch (file.type) {
      case 'DIR': {
        return target.openFiles({
          params: {
            path: encodeURIComponent(file.path),
          },
        });
      }
      case 'FILE': {
        return target.openFilePreview(file);
      }
    }
  },
});

sample({
  clock: createDirectoryPressed,
  source: $currentFile,
  target: createDirectoryModal.dialog.open,
});

sample({
  clock: renamePressed,
  target: renameFileModal.dialog.open,
});

sample({
  clock: removePressed,
  target: removeFileConfirmModal.dialog.open,
});

createAction({
  clock: removeFileConfirmModal.removed,
  source: $currentFile,
  target: {
    closePreview: filePreviewModal.dialog.close,
    getFiles: getFilesFx,
  },
  fn(target, currentFile) {
    target.closePreview();
    target.getFiles({ path: currentFile?.path });
  },
});

sample({
  clock: removeFileConfirmModal.removed,
  target: [filePreviewModal.dialog.close],
});

sample({
  clock: createDirectoryModal.created,
  source: routes.files.$params,
  target: getFilesFx,
});

sample({
  clock: openFilePreview,
  target: filePreviewModal.dialog.open,
});

sample({
  clock: goBackPressed,
  source: $currentFile,
  filter: Boolean,
  fn: (currentFile) => {
    const path = currentFile.path.split('/');
    const backPath = path.slice(0, path.length - 1);

    return { params: { path: encodeURIComponent(backPath.join('/')) } };
  },
  target: routes.files.open,
});

sample({
  clock: uploadFilesDialog.filesUploaded,
  source: $files,
  fn: (files, newFiles) => [...newFiles, ...files],
  target: $files,
});

sample({
  clock: renameFileModal.fileRenamed,
  source: $files,
  fn: (files, info) => {
    const file = files.find((file) => file.id === info.file.id);

    if (!file) {
      return files;
    }

    file.filename = info.newName;

    return [...files];
  },
  target: $files,
});
