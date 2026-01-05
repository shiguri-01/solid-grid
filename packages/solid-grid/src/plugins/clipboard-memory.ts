import type { CellPatch, CellPosition, CellRange } from "../gridsheet";
import type { GridPlugin } from "../plugin";

export type ClipboardData<T> = {
  data: T[][];
  range: CellRange;
};

/** Options for in-memory clipboard behavior. */
export type ClipboardPluginOptions<T> = {
  getData: () => T[][];
  onCopy?: (
    data: T[][],
    range: CellRange,
  ) => boolean | undefined | Promise<boolean | undefined>;
  onCut?: (
    data: T[][],
    range: CellRange,
  ) => boolean | undefined | Promise<boolean | undefined>;
  onPaste?: (
    clipboardData: T[][],
    targetPosition: CellPosition,
  ) =>
    | CellPatch<T>[]
    | false
    | undefined
    | Promise<CellPatch<T>[] | false | undefined>;
  onClipboardChange?: (clipboard: ClipboardData<T> | null) => void;
  emptyValue?: T;
  getEmptyValue?: (pos: CellPosition) => T;
  copyKeys?: string[];
  cutKeys?: string[];
  pasteKeys?: string[];
};

function extractSelection<T>(data: T[][], range: CellRange): T[][] {
  const result: T[][] = [];
  for (let r = range.min.row; r <= range.max.row; r++) {
    const row: T[] = [];
    for (let c = range.min.col; c <= range.max.col; c++) {
      const rowData = data[r];
      if (rowData && c < rowData.length) {
        const value = rowData[c];
        if (value !== undefined) {
          row.push(value);
        }
      }
    }
    result.push(row);
  }
  return result;
}

function buildClearPatches<T>(
  range: CellRange,
  getEmptyValue: (pos: CellPosition) => T,
): CellPatch<T>[] {
  const patches: CellPatch<T>[] = [];
  for (let r = range.min.row; r <= range.max.row; r++) {
    for (let c = range.min.col; c <= range.max.col; c++) {
      const pos = { row: r, col: c };
      patches.push({ pos, value: getEmptyValue(pos) });
    }
  }
  return patches;
}

function buildPastePatches<T>(
  data: T[][],
  start: CellPosition,
  rows: number,
  cols: number,
): CellPatch<T>[] {
  const patches: CellPatch<T>[] = [];
  for (let r = 0; r < data.length; r++) {
    const row = data[r];
    if (!row) continue;
    for (let c = 0; c < row.length; c++) {
      const targetRow = start.row + r;
      const targetCol = start.col + c;
      if (targetRow < 0 || targetCol < 0) continue;
      if (targetRow >= rows || targetCol >= cols) continue;
      const value = row[c];
      if (value === undefined) continue;
      patches.push({ pos: { row: targetRow, col: targetCol }, value });
    }
  }
  return patches;
}

/** In-memory clipboard with optional cut clearing. */
export function clipboardMemoryPlugin<T>(
  options: ClipboardPluginOptions<T>,
): GridPlugin<T> {
  let clipboard: ClipboardData<T> | null = null;
  const copyKeys = options.copyKeys ?? ["c"];
  const cutKeys = options.cutKeys ?? ["x"];
  const pasteKeys = options.pasteKeys ?? ["v"];
  const getEmptyValue =
    options.getEmptyValue ??
    (options.emptyValue !== undefined ? () => options.emptyValue as T : null);

  const setClipboard = (next: ClipboardData<T> | null) => {
    clipboard = next;
    options.onClipboardChange?.(next);
  };

  return {
    name: "clipboard-memory",
    onEvent(ev, api) {
      if (ev.type !== "key:down") return;
      const e = ev.e;
      if (e.isComposing || api.isEditing()) return;

      const key = e.key.toLowerCase();
      const isCopy = (e.ctrlKey || e.metaKey) && copyKeys.includes(key);
      const isCut = (e.ctrlKey || e.metaKey) && cutKeys.includes(key);
      const isPaste = (e.ctrlKey || e.metaKey) && pasteKeys.includes(key);
      if (!isCopy && !isCut && !isPaste) return;

      const sel = api.selection();
      const ac = api.activeCell();

      if (isCopy || isCut) {
        if (!sel) return true;
        e.preventDefault();
        void (async () => {
          const copiedData = extractSelection(options.getData(), sel);
          const result = isCopy
            ? await options.onCopy?.(copiedData, sel)
            : await options.onCut?.(copiedData, sel);
          if (result === false) return;
          setClipboard({ data: copiedData, range: sel });
          if (isCut && getEmptyValue) {
            const patches = buildClearPatches(sel, getEmptyValue);
            if (patches.length > 0) {
              api.updateCells(patches);
            }
          }
        })();
        return true;
      }

      if (isPaste) {
        if (!ac || !clipboard) return true;
        e.preventDefault();
        void (async () => {
          const result = await options.onPaste?.(clipboard.data, ac);
          if (result === false) return;
          const patches =
            result ??
            buildPastePatches(clipboard.data, ac, api.numRows(), api.numCols());
          if (patches.length > 0) {
            api.updateCells(patches);
          }
        })();
        return true;
      }
    },
  };
}
