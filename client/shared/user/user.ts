import type { Profile } from '@shared/api';
import { createStore } from 'effector';
import { createRequestEffect } from '../libs/request-effect';
import { createAction } from 'effector-action';

export const getProfileFx = createRequestEffect(({ client }) =>
  client.getProfile(),
);

export const $user = createStore<Profile | null>(null);

createAction({
  clock: getProfileFx.doneData,
  target: {
    $user,
  },
  fn: (target, result) => {
    if (result.ok) {
      target.$user(result.data);
    } else {
      target.$user(null);
    }
  },
});
