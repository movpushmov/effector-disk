import { Dialog, Flex, Title } from '@mantine/core';
import type { UploadFilesDialogModel } from '../model';
import { useUnit } from 'effector-react';
import { UploadFile } from './upload-file';

import styles from './upload-file.module.css';

interface Props {
  model: UploadFilesDialogModel;
}

export const UploadFilesDialog = ({ model }: Props) => {
  const { files } = useUnit(model);
  const { opened, onClose } = useUnit(model.dialog);

  const loadedFiles = files.filter((file) => file.progress >= 100);

  return (
    <Dialog
      className={styles.dialog}
      opened={opened}
      withCloseButton
      onClose={onClose}
    >
      <Title order={4} mb="lg">
        Всего загружено: {loadedFiles.length}/{files.length}
      </Title>

      <Flex direction="column" gap="md">
        {files.map((file) => (
          <UploadFile file={file} />
        ))}
      </Flex>
    </Dialog>
  );
};
