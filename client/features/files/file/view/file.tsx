import type { FileInfo } from '@shared/api';
import { FileIcon } from './file-icon';
import { Flex, Text } from '@mantine/core';

import styles from './file.module.css';

interface Props {
  file: FileInfo;
}

export const File = ({ file }: Props) => {
  return (
    <Flex direction="column" align="center" gap="xs">
      <FileIcon file={file} />
      <Text className={styles.filename} fw="500">
        {file.filename}
      </Text>
    </Flex>
  );
};
