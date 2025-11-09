import {
  createDirectoryModal,
  filePreviewModal,
  removeFileConfirmModal,
  renameFileModal,
  uploadFilesDialog,
} from '../model';
import { Header } from './header';
import { Content } from './content';
import { Flex, Modal } from '@mantine/core';
import { CreateDirectoryModal } from '@client/features/files/create-directory-modal';
import { RemoveFileConfirmModal } from '@client/features/files/remove-file-confirm-modal';
import { RenameFileModal } from '@client/features/files/rename-file-modal';
import { UploadFilesDialog } from '@client/features/files/upload-files-dialog';
import { FilePreviewModal } from '@client/features/files/file-preview-modal';
import { FilesDropzone } from './dropzone';

export const FilesScreen = () => {
  return (
    <Flex justify="center">
      <Flex w="100%" direction="column" gap="md" p="xl">
        <Header />
        <Content />
      </Flex>

      <FilesDropzone overlayMode />

      <Modal.Stack>
        <FilePreviewModal model={filePreviewModal} />
        <RemoveFileConfirmModal model={removeFileConfirmModal} />
      </Modal.Stack>

      <CreateDirectoryModal model={createDirectoryModal} />
      <RenameFileModal model={renameFileModal} />
      <UploadFilesDialog model={uploadFilesDialog} />
    </Flex>
  );
};
