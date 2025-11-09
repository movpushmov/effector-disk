import { Menu } from '@mantine/core';
import { createFactory } from '@withease/factories';
import {
  createEvent,
  createStore,
  sample,
  type Effect,
  type EventCallable,
  type Store,
} from 'effector';
import { createAction } from 'effector-action';
import { useUnit, type Equal } from 'effector-react';
import { useEffect, type ReactNode } from 'react';

type UnitShape = Record<
  string,
  EventCallable<any> | Effect<any, any, any> | Store<any>
>;

type ResolveShape<Shape extends UnitShape> = {
  [Key in keyof Shape]: Shape[Key] extends EventCallable<infer T>
    ? Equal<T, void> extends true
      ? () => void
      : (payload: T) => T
    : Shape[Key] extends Effect<infer P, infer D, any>
      ? Equal<P, void> extends true
        ? () => Promise<D>
        : (payload: P) => Promise<D>
      : Shape[Key] extends Store<infer V>
        ? V
        : never;
};

interface Options<Shape extends UnitShape> {
  items: ((
    resolvedShape: ResolveShape<Shape> & { payload: unknown },
  ) => ReactNode)[];
  shape: Shape;
}

export const createContextMenu = createFactory(
  <Shape extends UnitShape>({ items, shape }: Options<Shape>) => {
    const $opened = createStore(false);
    const $coords = createStore<{ x: number; y: number } | null>(null);
    const $payload = createStore<unknown>(null);

    const contextMenuTriggered = createEvent<
      | React.MouseEvent<HTMLElement, MouseEvent>
      | { e: React.MouseEvent<HTMLElement, MouseEvent>; payload: unknown }
    >();

    const openedChanged = createEvent<boolean>();

    createAction({
      clock: contextMenuTriggered,
      target: {
        $opened,
        $coords,
        $payload,
      },
      fn: (target, triggerPayload) => {
        const e = 'e' in triggerPayload ? triggerPayload.e : triggerPayload;

        e.preventDefault();
        e.stopPropagation();

        target.$coords({ x: e.clientX, y: e.clientY });

        target.$opened(true);

        if ('e' in triggerPayload) {
          target.$payload(triggerPayload.payload);
        }
      },
    });

    sample({
      clock: openedChanged,
      target: $opened,
    });

    const UI = () => {
      const { opened, coords, onOpenedChanged, payload } = useUnit({
        opened: $opened,
        coords: $coords,
        onOpenedChanged: openedChanged,
        payload: $payload,
      });

      const uiUnits = useUnit(shape);

      useEffect(() => {
        function handler() {
          onOpenedChanged(false);
        }

        document.addEventListener('click', handler);

        return () => document.removeEventListener('click', handler);
      }, [onOpenedChanged]);

      return (
        <Menu radius="lg" opened={opened} onChange={onOpenedChanged}>
          <Menu.Dropdown top={coords?.y} left={coords?.x}>
            {items.map((item) => item({ ...uiUnits, payload }))}
          </Menu.Dropdown>
        </Menu>
      );
    };

    return {
      UI,

      $payload,

      '@@unitShape': () => ({
        onContextMenuTriggered: contextMenuTriggered,
      }),
    };
  },
);
