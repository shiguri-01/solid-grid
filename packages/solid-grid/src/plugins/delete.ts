import type { CellPatch, CellPosition, CellRange } from "../gridsheet";
import type { GridPlugin } from "../plugin";
import { buildClearPatches } from "./utils";

/** Options for delete behavior. */
export type DeletePluginOptions<T> = {
  keys?: string[];
  emptyValue?: T;
  getEmptyValue?: (pos: CellPosition) => T;
  onDelete?: (range: CellRange) => CellPatch<T>[] | false | undefined;
};

/** Clears selected range with provided empty values. */
export function deletePlugin<T>(
  options: DeletePluginOptions<T>,
): GridPlugin<T> {
  const keys = options.keys ?? ["Delete", "Backspace"];
  const getEmptyValue =
    options.getEmptyValue ??
    (options.emptyValue !== undefined ? () => options.emptyValue as T : null);

  return {
    name: "delete",
    onEvent(ev, api) {
      if (ev.type !== "key:down") return;
      const e = ev.e;
      if (e.isComposing || api.isEditing()) return;
      if (!keys.includes(e.key)) return;

      const range = api.selection();
      if (!range) {
        e.preventDefault();
        return true;
      }

      const result = options.onDelete?.(range);
      if (result === false) {
        e.preventDefault();
        return true;
      }
      if (Array.isArray(result)) {
        api.updateCells(result);
        e.preventDefault();
        return true;
      }

      if (getEmptyValue) {
        const patches = buildClearPatches(range, getEmptyValue);
        if (patches.length > 0) {
          api.updateCells(patches);
        }
        e.preventDefault();
        return true;
      }

      return true;
    },
  };
}
