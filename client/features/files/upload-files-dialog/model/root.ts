import { createDialog } from '@client/shared/libs/dialogs';
import { createRequestEffect } from '@client/shared/libs/request-effect';
import {
  ClientProblemKind,
  type FileInfo,
  UploadProblemKind,
  type Result,
  type UploadFilesOptions,
  type UploadFileSuccess,
} from '@shared/api';
import { createFactory, invoke } from '@withease/factories';
import { createEvent, createStore, sample, scopeBind } from 'effector';
import { createAction } from 'effector-action';

export type UploadFilesDialogModel = ReturnType<
  typeof uploadFilesDialogFactory
>;

export type FileToUpload = {
  index: number;
  progress: number;
  isError: boolean;
  name: string;
};

export const uploadFilesDialogFactory = createFactory(() => {
  const uploadFilesFx = createRequestEffect<
    UploadFilesOptions,
    Result<UploadFileSuccess, UploadProblemKind | ClientProblemKind>[]
  >(async ({ client, params }) => client.uploadFiles(params));

  const dialog = invoke(() => createDialog<void>());

  const $files = createStore<FileToUpload[]>([]);

  const updateFile = createEvent<{
    index: number;
    progress: number;
    isError?: true;
  }>();

  const uploadFiles = createEvent<{ files: File[]; path: string | null }>();
  const uploadFilesToServer = createEvent<UploadFilesOptions>();

  const filesUploaded = createEvent<FileInfo[]>();

  createAction({
    clock: uploadFiles,
    source: $files,
    target: {
      $files,
      open: dialog.open,
      uploadFilesToServer,
    },
    fn: (target, oldFiles, { files, path }) => {
      const updateFileBinded = scopeBind(updateFile);

      const newFiles = files.map(
        (file, index): FileToUpload => ({
          index: oldFiles.length + index,
          progress: 0,
          isError: false,
          name: file.name,
        }),
      );

      target.$files([...oldFiles, ...newFiles]);
      target.open();

      target.uploadFilesToServer({
        files,
        path,
        onProgress: (index, progress) => updateFileBinded({ index, progress }),
      });
    },
  });

  sample({
    clock: uploadFilesToServer,
    target: uploadFilesFx,
  });

  createAction({
    clock: uploadFilesFx.doneData,
    source: $files,
    target: {
      $files,
      filesUploaded,
    },
    fn: (target, oldFiles, result) => {
      const newFiles = [...oldFiles];

      result.forEach((fileResult, index) => {
        if (!fileResult.ok) {
          newFiles[index].isError = true;
        } else {
          newFiles[index].progress = 100;
        }
      });

      target.filesUploaded(
        result.filter((result) => result.ok).map((result) => result.data.file),
      );

      return target.$files(newFiles);
    },
  });

  return {
    dialog,

    uploadFiles,
    filesUploaded,

    '@@unitShape': () => ({
      files: $files,
    }),
  };
});
