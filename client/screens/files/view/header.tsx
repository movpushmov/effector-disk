import { useUnit } from 'effector-react';
import { $breadcrumbs, $currentFile, goBackPressed } from '../model';
import { ActionIcon, Breadcrumbs, Flex, Text, Title } from '@mantine/core';
import { IconArrowLeft, IconChevronRight } from '@tabler/icons-react';
import { Link } from '@argon-router/react';
import { routes } from '@client/shared/routing';

import styles from './header.module.css';

export const Header = () => {
  const { currentFile, breadcrumbs, onGoBackPressed } = useUnit({
    currentFile: $currentFile,
    breadcrumbs: $breadcrumbs,
    onGoBackPressed: goBackPressed,
  });

  if (!currentFile) {
    return (
      <header>
        <Title order={2}>Файлы</Title>
      </header>
    );
  }

  return (
    <header>
      <Breadcrumbs separator={<IconChevronRight size={20} />}>
        {breadcrumbs.map(({ name, path }) => (
          <Link className={styles.link} to={routes.files} params={{ path }}>
            <Text td="none" c="dimmed">
              {name}
            </Text>
          </Link>
        ))}

        <Text></Text>
      </Breadcrumbs>

      <Flex mt="md" align="center" gap="xs">
        <ActionIcon onClick={onGoBackPressed} variant="transparent" c="dark.2">
          <IconArrowLeft />
        </ActionIcon>

        <Title order={2}>{currentFile?.filename}</Title>
      </Flex>
    </header>
  );
};
