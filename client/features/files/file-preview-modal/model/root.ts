import { createDialog } from '@client/shared/libs/dialogs';
import { type FileInfo } from '@shared/api';
import { createFactory, invoke } from '@withease/factories';
import type { EventCallable } from 'effector';

export type FilePreviewModalModel = ReturnType<typeof filePreviewModalFactory>;

export const filePreviewModalFactory = createFactory(
  ({ removePressed }: { removePressed: EventCallable<FileInfo> }) => {
    const dialog = invoke(() => createDialog<FileInfo>());

    const $file = dialog.$params;

    return {
      dialog,

      '@@unitShape': () => ({
        file: $file,
        onRemovePressed: removePressed,
      }),
    };
  },
);
