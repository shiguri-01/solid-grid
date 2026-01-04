import type { GridApi, GridEvent, GridEventHandler } from "./gridsheet";

export type GridPlugin<T> = {
  name: string;
  onEvent?: GridEventHandler<T>;
};

export function createPluginHost<T>(plugins: GridPlugin<T>[]) {
  const list = plugins;

  const onEvent: GridEventHandler<T> = (ev: GridEvent, api: GridApi<T>) => {
    for (const p of list) {
      const handled = p.onEvent?.(ev, api);
      if (handled === true) return true;
    }
    return false;
  };

  return { onEvent };
}
