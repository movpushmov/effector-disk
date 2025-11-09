import { $client } from '@client/shared/api';
import type { DiskApiClient } from '@client/shared/api/client';
import { attach, createEffect, type Effect } from 'effector';

type ModifiedParams<Params> = { params: Params; client: DiskApiClient };
type Handler<Params, Done> = (params: ModifiedParams<Params>) => Promise<Done>;

export function createRequestEffect<Params, Done, Fail = Error>(
  handler: Handler<Params, Done>,
): Effect<Params, Done, Fail> {
  const fx = createEffect<ModifiedParams<Params>, Done, Fail>(handler);

  return attach({
    source: $client,
    mapParams: (params, client) => ({ params, client }),
    effect: fx,
  });
}
