import { ActionIcon, CloseButton, Flex, Image, Modal } from '@mantine/core';
import type { FilePreviewModalModel } from '../model';
import { useUnit } from 'effector-react';
import { $client } from '@client/shared/api';

import styles from './view.module.css';
import { IconTrash } from '@tabler/icons-react';

interface Props {
  model: FilePreviewModalModel;
}

export const FilePreviewModal = ({ model }: Props) => {
  const { file, onRemovePressed } = useUnit(model);
  const { opened, onClose } = useUnit(model.dialog);

  const { client } = useUnit({ client: $client });

  return (
    <Modal
      className={styles.modal}
      opened={opened}
      onClose={onClose}
      withCloseButton={false}
      fullScreen
    >
      <Modal.Header pos="absolute" w="100%" bg="transparent">
        <Flex w="100%" justify="flex-end">
          <ActionIcon
            size="lg"
            onClick={() => onRemovePressed(file)}
            variant="subtle"
            color="dark.2"
          >
            <IconTrash size={22} />
          </ActionIcon>

          <CloseButton size="lg" onClick={onClose} />
        </Flex>
      </Modal.Header>

      {file ? (
        <Image
          h="100%"
          fit="contain"
          w="100%"
          src={client.getPreviewUrl(file.id)}
        />
      ) : null}
    </Modal>
  );
};
