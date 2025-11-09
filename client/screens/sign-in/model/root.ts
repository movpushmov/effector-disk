import {
  type SignInRequest,
  type SignInSuccess,
  type SignInProblemKind,
  ClientProblemKind,
  type Result,
} from '@shared/api';
import { createRequestEffect } from '@client/shared/libs/request-effect';
import { createForm } from '@effector-reform/core';
import { attach, createEvent, sample } from 'effector';
import { createAction } from 'effector-action';
import { notifications } from '@client/shared/libs/notifications';
import { routes } from '@client/shared/routing';

import * as user from '@client/shared/user';

const getProfileFx = attach({ effect: user.getProfileFx });

const notify = {
  invalidCredentials: notifications.error.prepend(
    () => 'Неверный логин или пароль',
  ),
  invalidRequest: notifications.error.prepend(
    () => 'Отправлены неверные данные',
  ),
  networkError: notifications.error.prepend(
    () => 'Ошибка сети, попробуйте ещё раз позже',
  ),
  internal: notifications.error.prepend(
    () => 'Что-то пошло не так, попробуйте ещё раз позже',
  ),
};

export const signInFx = createRequestEffect<
  SignInRequest,
  Result<SignInSuccess, SignInProblemKind | ClientProblemKind>
>(async ({ client, params }) => client.signIn(params));

export const signInForm = createForm({
  schema: {
    username: '',
    password: '',
  },
});

export const $signInPending = signInFx.pending;
const authorize = createEvent();

sample({
  clock: signInForm.validatedAndSubmitted,
  target: signInFx,
});

createAction({
  clock: signInFx.doneData,
  target: {
    ...notify,
    authorize,
  },
  fn: (target, result) => {
    if (!result.ok) {
      switch (result.error) {
        case 'INVALID_CREDENTIALS': {
          return target.invalidCredentials();
        }
        case 'INVALID_REQUEST': {
          return target.invalidRequest();
        }
        case 'INTERNAL_SERVER_ERROR': {
          return target.internal();
        }
        case 'NETWORK_ERROR': {
          return target.networkError();
        }
      }
    }

    return target.authorize();
  },
});

sample({
  clock: authorize,
  target: getProfileFx,
});

sample({
  clock: getProfileFx.doneData,
  fn: () => ({ params: { path: undefined } }),
  target: routes.files.open,
});
