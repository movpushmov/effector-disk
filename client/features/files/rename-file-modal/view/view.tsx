import { Button, Flex, Modal, TextInput } from '@mantine/core';
import type { RenameFileModalModel } from '../model';
import { useUnit } from 'effector-react';

interface Props {
  model: RenameFileModalModel;
}

export const RenameFileModal = ({ model }: Props) => {
  const { onCancelPressed, onNameChanged, onRenameFilePressed, name } =
    useUnit(model);
  const { onClose, opened } = useUnit(model.dialog);

  return (
    <Modal opened={opened} onClose={onClose} title="Переименование файла">
      <TextInput
        value={name}
        placeholder="Новое имя"
        onChange={(e) => onNameChanged(e.currentTarget.value)}
      />

      <Flex direction="row" justify="flex-end" mt="md" gap="sm">
        <Button variant="default" onClick={onCancelPressed}>
          Отменить
        </Button>

        <Button variant="light" onClick={onRenameFilePressed}>
          Переименовать
        </Button>
      </Flex>
    </Modal>
  );
};
