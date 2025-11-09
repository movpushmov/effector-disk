import { Button, Flex, Modal, TextInput } from '@mantine/core';
import { useUnit } from 'effector-react';
import type { CreateDirectoryModalModel } from '../model';

interface Props {
  model: CreateDirectoryModalModel;
}

export const CreateDirectoryModal = ({ model }: Props) => {
  const { onClose, opened } = useUnit(model.dialog);
  const {
    name,
    createPending,
    onNameChanged,
    onCancelPressed,
    onConfirmPressed,
  } = useUnit(model);

  return (
    <Modal title="Создать директорию" opened={opened} onClose={onClose}>
      <TextInput
        value={name}
        onChange={(e) => onNameChanged(e.currentTarget.value)}
        placeholder="Имя директории"
      />

      <Flex direction="row" justify="flex-end" mt="md" gap="sm">
        <Button onClick={onCancelPressed} variant="default">
          Отменить
        </Button>

        <Button
          loading={createPending}
          onClick={onConfirmPressed}
          variant="light"
        >
          Создать
        </Button>
      </Flex>
    </Modal>
  );
};
