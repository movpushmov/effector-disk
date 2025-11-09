import { createStore } from 'effector';
import { DiskApiClient } from './client';

export const $client = createStore<DiskApiClient>(new DiskApiClient(), {
  serialize: 'ignore',
});
