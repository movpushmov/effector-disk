import { useUnit } from 'effector-react';
import {
  $currentFile,
  $files,
  $filesPending,
  createDirectoryPressed,
  fileContextMenu,
  filePressed,
  listContextMenu,
  uploadFiles,
} from '../model';
import { Button, Flex, Grid, Loader } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';

import styles from './content.module.css';
import { File } from '@client/features/files/file';
import { FilesDropzone } from './dropzone';

export const Content = () => {
  const { files, filesPending, onFilePressed, onCreateDirectoryPressed } =
    useUnit({
      currentFile: $currentFile,
      files: $files,
      filesPending: $filesPending,
      onCreateDirectoryPressed: createDirectoryPressed,
      onFilePressed: filePressed,
      onUploadFiles: uploadFiles,
    });

  const listMenu = useUnit(listContextMenu);
  const fileMenu = useUnit(fileContextMenu);

  if (filesPending) {
    return <Loader size="xl" />;
  }

  if (!files.length) {
    return (
      <Flex direction="column" gap="md" w="100%">
        <FilesDropzone />

        <Button
          onClick={onCreateDirectoryPressed}
          radius="md"
          h={56}
          bg="dark.6"
        >
          <Flex
            justify="center"
            align="center"
            p={4}
            className={styles.icon}
            mr="xs"
            bg="dark.4"
          >
            <IconPlus />
          </Flex>
          Создать папку
        </Button>
      </Flex>
    );
  }

  return (
    <Grid onContextMenu={listMenu.onContextMenuTriggered}>
      {files.map((file) => (
        <Grid.Col key={file.id} span={3}>
          <Button
            onDoubleClick={() => onFilePressed(file)}
            onContextMenu={(e) =>
              fileMenu.onContextMenuTriggered({ e, payload: file })
            }
            py="xs"
            className={styles['file-button']}
            unstyled
          >
            <File file={file} />
          </Button>
        </Grid.Col>
      ))}

      <fileContextMenu.UI />
      <listContextMenu.UI />
    </Grid>
  );
};
