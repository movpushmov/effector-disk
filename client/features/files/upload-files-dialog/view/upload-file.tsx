import { Flex, Loader, Progress, Text } from '@mantine/core';
import type { FileToUpload } from '../model';
import { IconCheck } from '@tabler/icons-react';

interface Props {
  file: FileToUpload;
}

export const UploadFile = ({ file }: Props) => {
  if (file.progress >= 100) {
    return (
      <Flex direction="row" align="center" gap="md">
        <IconCheck size={24} color="green" />

        <Flex ml={-6} flex={1} direction="column" gap="xs">
          <Text>{file.name}</Text>
          <Progress value={file.progress} color="green" />
        </Flex>
      </Flex>
    );
  }

  return (
    <Flex direction="row" align="center" gap="md">
      <Loader size="xs" />

      <Flex flex={1} direction="column" gap="xs">
        <Text>{file.name}</Text>
        <Progress value={file.progress} />
      </Flex>
    </Flex>
  );
};
