import type { CellPatch, CellPosition } from "../gridsheet";
import type { GridPlugin } from "../plugin";

export type ClipboardTextPluginOptions<T> = {
  getData: () => T[][];
  toText?: (data: T[][]) => string;
  fromText?: (text: string, target: CellPosition) => CellPatch<T>[] | false;
  parseCell?: (raw: string) => T;
  formatCell?: (value: T) => string;
  readText?: () => Promise<string>;
  writeText?: (text: string) => Promise<void>;
  emptyValue?: T;
  getEmptyValue?: (pos: CellPosition) => T;
  copyKeys?: string[];
  cutKeys?: string[];
  pasteKeys?: string[];
};

const DEFAULT_COPY_KEYS = ["c"];
const DEFAULT_CUT_KEYS = ["x"];
const DEFAULT_PASTE_KEYS = ["v"];

function defaultReadText(): Promise<string> {
  if (typeof navigator === "undefined" || !navigator.clipboard) {
    return Promise.resolve("");
  }
  return navigator.clipboard.readText();
}

function defaultWriteText(text: string): Promise<void> {
  if (typeof navigator === "undefined" || !navigator.clipboard) {
    return Promise.resolve();
  }
  return navigator.clipboard.writeText(text);
}

function serializeTsv<T>(
  data: T[][],
  formatCell: (value: T) => string,
): string {
  return data.map((row) => row.map(formatCell).join("\t")).join("\n");
}

function parseTsv<T>(
  text: string,
  target: CellPosition,
  parseCell: (raw: string) => T,
): CellPatch<T>[] {
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const rows = normalized.split("\n");
  const patches: CellPatch<T>[] = [];
  for (let r = 0; r < rows.length; r++) {
    const cols = rows[r]?.split("\t") ?? [];
    for (let c = 0; c < cols.length; c++) {
      patches.push({
        pos: { row: target.row + r, col: target.col + c },
        value: parseCell(cols[c] ?? ""),
      });
    }
  }
  return patches;
}

function buildClearPatches<T>(
  range: { min: CellPosition; max: CellPosition },
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

export function clipboardTextPlugin<T>(
  options: ClipboardTextPluginOptions<T>,
): GridPlugin<T> {
  const copyKeys = options.copyKeys ?? DEFAULT_COPY_KEYS;
  const cutKeys = options.cutKeys ?? DEFAULT_CUT_KEYS;
  const pasteKeys = options.pasteKeys ?? DEFAULT_PASTE_KEYS;
  const parseCell = options.parseCell ?? ((raw) => raw as unknown as T);
  const formatCell = options.formatCell ?? ((value) => String(value));

  const toText = options.toText ?? ((data) => serializeTsv(data, formatCell));
  const fromText =
    options.fromText ?? ((text, target) => parseTsv(text, target, parseCell));

  const readText = options.readText ?? defaultReadText;
  const writeText = options.writeText ?? defaultWriteText;
  const getEmptyValue =
    options.getEmptyValue ??
    (options.emptyValue !== undefined ? () => options.emptyValue as T : null);

  return {
    name: "clipboard-text",
    onEvent(ev, api) {
      if (ev.type !== "key:down") return;
      const e = ev.e;
      if (e.isComposing || api.isEditing()) return;

      const key = e.key.toLowerCase();
      const isCopy = (e.ctrlKey || e.metaKey) && copyKeys.includes(key);
      const isCut = (e.ctrlKey || e.metaKey) && cutKeys.includes(key);
      const isPaste = (e.ctrlKey || e.metaKey) && pasteKeys.includes(key);
      if (!isCopy && !isCut && !isPaste) return;

      if (isCopy || isCut) {
        const sel = api.selection();
        if (!sel) return true;
        e.preventDefault();
        void (async () => {
          const data = options.getData();
          const rows = data.slice(sel.min.row, sel.max.row + 1);
          const selected = rows.map((row) =>
            row.slice(sel.min.col, sel.max.col + 1),
          );
          const text = toText(selected);
          await writeText(text);
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
        const ac = api.activeCell();
        if (!ac) return true;
        e.preventDefault();
        void (async () => {
          const text = await readText();
          if (!text) return;
          const patches = fromText(text, ac);
          if (patches === false) return;
          if (patches.length > 0) {
            api.updateCells(patches);
          }
        })();
        return true;
      }
    },
  };
}
