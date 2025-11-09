import { Button, Flex, Modal } from '@mantine/core';
import type { RemoveFileConfirmModalModel } from '../model';
import { useUnit } from 'effector-react';

interface Props {
  model: RemoveFileConfirmModalModel;
}

export const RemoveFileConfirmModal = ({ model }: Props) => {
  const { file, onCancelPressed, onRemovePressed } = useUnit(model);
  const { opened, onClose } = useUnit(model.dialog);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={`Вы действительно хотите удалить файл ${file?.filename}?`}
    >
      <Flex direction="row" justify="flex-end" gap="sm">
        <Button onClick={onCancelPressed} variant="light">
          Отменить
        </Button>

        <Button onClick={onRemovePressed} variant="default">
          Удалить
        </Button>
      </Flex>
    </Modal>
  );
};
