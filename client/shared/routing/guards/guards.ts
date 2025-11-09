import { $user } from '@client/shared/user';
import { attach } from 'effector';

export const authorizedGuardFx = attach({
  source: $user,
  effect: (user) => {
    if (!user) {
      return Promise.reject();
    }
  },
});

export const notAuthorizedGuardFx = attach({
  source: $user,
  effect: (user) => {
    if (user) {
      return Promise.reject();
    }
  },
});
