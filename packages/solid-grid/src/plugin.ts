import type { GridApi, GridEvent, GridEventHandler } from "./gridsheet";

/** Plugin interface for extending grid behavior. */
export type GridPlugin<T> = {
  name: string;
  onEvent?: GridEventHandler<T>;
};

/** Compose multiple plugins into a single event handler. */
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
