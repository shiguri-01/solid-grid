import type { CellPatch, CellPosition, CellRange } from "../gridsheet";

export function buildClearPatches<T>(
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
