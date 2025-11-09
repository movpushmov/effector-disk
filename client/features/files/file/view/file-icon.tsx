import { $client } from '@client/shared/api';
import { Image } from '@mantine/core';
import type { FileInfo } from '@shared/api';
import { useUnit } from 'effector-react';

interface Props {
  file: FileInfo;
}

export const FileIcon = ({ file }: Props) => {
  const { client } = useUnit({ client: $client });

  if (file.type === 'DIR') {
    return (
      <Image
        w={80}
        h={80}
        src="https://yastatic.net/s3/disk/_/e75430d9b1b840f7fe67.svg"
      />
    );
  }

  if (file.hasThumbnail) {
    return <Image w={80} h={80} src={client.getThumbnailUrl(file.id)} />;
  }

  // TO DO: icon by mimetype
  return null;
};
