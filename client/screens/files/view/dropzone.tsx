import { useUnit } from 'effector-react';
import { $currentFile, uploadFiles } from '../model';
import { Dropzone, IMAGE_MIME_TYPE, MIME_TYPES } from '@mantine/dropzone';
import { IconPhoto, IconUpload, IconX } from '@tabler/icons-react';
import { Box, Group, Text } from '@mantine/core';
import { useEffect, useMemo, useState } from 'react';

import styles from './dropzone.module.css';

interface Props {
  overlayMode?: boolean;
}

export const FilesDropzone = ({ overlayMode }: Props) => {
  const { currentFile, onUploadFiles } = useUnit({
    currentFile: $currentFile,
    onUploadFiles: uploadFiles,
  });

  const [visisble, setIsVisible] = useState(false);

  useEffect(() => {
    if (overlayMode) {
      function showDropzone() {
        setIsVisible(true);
      }

      function hideDropzone() {
        setIsVisible(false);
      }

      document.addEventListener('dragenter', showDropzone);
      document.addEventListener('dragover', showDropzone);
      document.addEventListener('drop', hideDropzone);
      document.addEventListener('dragleave', hideDropzone);

      return () => {
        document.removeEventListener('dragenter', showDropzone);
        document.removeEventListener('dragover', showDropzone);
        document.removeEventListener('dragleave', hideDropzone);
      };
    }
  }, [overlayMode]);

  const className = useMemo(() => {
    if (!overlayMode) {
      return undefined;
    }

    return visisble
      ? `${styles.visible} ${styles['dropzone-container']}`
      : styles['dropzone-container'];
  }, [overlayMode, visisble]);

  return (
    <Box className={className}>
      <Dropzone
        w="100%"
        h="100%"
        onDrop={(files) =>
          onUploadFiles({ files, path: currentFile?.path ?? null })
        }
        maxSize={100 * 1024 ** 2}
        accept={[...IMAGE_MIME_TYPE, MIME_TYPES.mp4]}
      >
        <Group
          justify="center"
          gap="xl"
          mih={220}
          style={{ pointerEvents: 'none' }}
        >
          <Dropzone.Accept>
            <IconUpload
              size={52}
              color="var(--mantine-color-blue-6)"
              stroke={1.5}
            />
          </Dropzone.Accept>

          <Dropzone.Reject>
            <IconX size={52} color="var(--mantine-color-red-6)" stroke={1.5} />
          </Dropzone.Reject>

          <Dropzone.Idle>
            <IconPhoto
              size={52}
              color="var(--mantine-color-dimmed)"
              stroke={1.5}
            />
          </Dropzone.Idle>

          <div>
            <Text size="xl" inline>
              Выберите файлы на компьютере или перетащите их сюда
            </Text>

            <Text size="sm" c="dimmed" inline mt={7}>
              Прикрепляйте столько файлов, сколько захотите, но каждый из них не
              должен превышать 100 мегабайт
            </Text>
          </div>
        </Group>
      </Dropzone>
    </Box>
  );
};
