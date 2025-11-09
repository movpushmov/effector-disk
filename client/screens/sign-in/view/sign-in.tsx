import {
  Box,
  Button,
  Flex,
  PasswordInput,
  TextInput,
  Title,
} from '@mantine/core';
import { useForm } from '@effector-reform/react';
import { $signInPending, signInForm } from '../model';
import { useUnit } from 'effector-react';

export const SignInScreen = () => {
  const { onSubmit, fields } = useForm(signInForm);
  const { signInPending } = useUnit({ signInPending: $signInPending });

  return (
    <Flex
      w="100%"
      direction="column"
      gap="lg"
      h="100%"
      justify="center"
      align="center"
    >
      <Title order={1}>Effector Disk</Title>

      <Box miw={350}>
        <form onSubmit={onSubmit}>
          <Flex direction="column" gap="lg">
            <TextInput
              value={fields.username.value}
              onChange={(e) => fields.username.onChange(e.currentTarget.value)}
              radius="lg"
              size="lg"
              placeholder="Логин"
            />

            <PasswordInput
              value={fields.password.value}
              onChange={(e) => fields.password.onChange(e.currentTarget.value)}
              radius="lg"
              size="lg"
              placeholder="Пароль"
            />

            <Button loading={signInPending} type="submit" radius="lg" size="lg">
              Войти
            </Button>
          </Flex>
        </form>
      </Box>
    </Flex>
  );
};
