import { batch } from "solid-js";
import type { CellPosition, GridApi } from "../gridsheet";
import { normalizeRange } from "../gridsheet";
import type { GridPlugin } from "../plugin";
import { clamp } from "../utils";

function moveBy(
  pos: CellPosition,
  dr: number,
  dc: number,
  rows: number,
  cols: number,
): CellPosition {
  return {
    row: clamp(pos.row + dr, 0, rows - 1),
    col: clamp(pos.col + dc, 0, cols - 1),
  };
}

/** Selection, drag, and arrow-key navigation. */
export function selectionPlugin<T>(): GridPlugin<T> {
  let anchor: CellPosition | null = null;
  let head: CellPosition | null = null;
  let dragging = false;
  let headerMode: "row" | "col" | null = null;
  let previousBodyUserSelect: string | null = null;

  const disableTextSelectionDuringDrag = () => {
    if (typeof document === "undefined" || previousBodyUserSelect !== null)
      return;
    const body = document.body;
    if (!body) return;
    previousBodyUserSelect = body.style.userSelect;
    body.style.userSelect = "none";
  };

  const restoreTextSelectionAfterDrag = () => {
    if (typeof document === "undefined" || previousBodyUserSelect === null)
      return;
    const body = document.body;
    if (body) {
      body.style.userSelect = previousBodyUserSelect;
    }
    previousBodyUserSelect = null;
  };
  const setSingle = (pos: CellPosition, api: GridApi<T>) => {
    anchor = pos;
    head = pos;
    batch(() => {
      api.setActiveCell(pos);
      api.setSelection(normalizeRange(pos, pos));
    });
  };

  const setRange = (
    rangeAnchor: CellPosition,
    rangeHead: CellPosition,
    api: GridApi<T>,
  ) => {
    anchor = rangeAnchor;
    head = rangeHead;
    api.setSelection(normalizeRange(rangeAnchor, rangeHead));
  };

  return {
    name: "selection",
    onEvent(ev, api) {
      switch (ev.type) {
        case "cell:pointerdown": {
          if (api.isEditing()) return true;

          // Ignore non-left clicks
          if (ev.e.button !== 0) return;

          ev.e.preventDefault();
          dragging = true;
          headerMode = null;
          disableTextSelectionDuringDrag();

          setSingle(ev.pos, api);
          return true;
        }

        case "cell:pointerover": {
          if (!dragging) return;
          // Do not treat as dragging if mouse button is not pressed
          if ((ev.e.buttons & 1) === 0) return;

          if (!anchor) {
            // This should not be reached
            anchor = ev.pos;
          }
          setRange(anchor, ev.pos, api);
          return true;
        }

        case "pointer:up": {
          if (dragging) dragging = false;
          headerMode = null;
          restoreTextSelectionAfterDrag();
          return;
        }

        case "corner:click": {
          const rows = api.numRows();
          const cols = api.numCols();
          if (rows <= 0 || cols <= 0) return true;
          const min = { row: 0, col: 0 };
          const max = { row: rows - 1, col: cols - 1 };
          dragging = false;
          anchor = min;
          head = max;
          batch(() => {
            api.setActiveCell(min);
            api.setSelection(normalizeRange(min, max));
          });
          return true;
        }

        case "rowheader:pointerdown": {
          const cols = api.numCols();
          if (cols <= 0) return true;
          const min = { row: ev.row, col: 0 };
          const max = { row: ev.row, col: cols - 1 };
          dragging = false;
          headerMode = "row";
          disableTextSelectionDuringDrag();
          anchor = min;
          head = max;
          batch(() => {
            api.setActiveCell(min);
            api.setSelection(normalizeRange(min, max));
          });
          return true;
        }

        case "rowheader:pointerover": {
          if (headerMode !== "row") return;
          if ((ev.e.buttons & 1) === 0) return;
          const cols = api.numCols();
          if (cols <= 0) return true;
          const startRow = anchor?.row ?? ev.row;
          const min = { row: Math.min(startRow, ev.row), col: 0 };
          const max = { row: Math.max(startRow, ev.row), col: cols - 1 };
          head = max;
          api.setSelection(normalizeRange(min, max));
          return true;
        }

        case "colheader:pointerdown": {
          const rows = api.numRows();
          if (rows <= 0) return true;
          const min = { row: 0, col: ev.col };
          const max = { row: rows - 1, col: ev.col };
          dragging = false;
          headerMode = "col";
          disableTextSelectionDuringDrag();
          anchor = min;
          head = max;
          batch(() => {
            api.setActiveCell(min);
            api.setSelection(normalizeRange(min, max));
          });
          return true;
        }

        case "colheader:pointerover": {
          if (headerMode !== "col") return;
          if ((ev.e.buttons & 1) === 0) return;
          const rows = api.numRows();
          if (rows <= 0) return true;
          const startCol = anchor?.col ?? ev.col;
          const min = { row: 0, col: Math.min(startCol, ev.col) };
          const max = { row: rows - 1, col: Math.max(startCol, ev.col) };
          head = max;
          api.setSelection(normalizeRange(min, max));
          return true;
        }

        case "key:down": {
          const e = ev.e;
          if (e.isComposing) return;
          if (api.isEditing()) return;

          const ac = api.activeCell();
          if (!ac) return;

          const key = e.key;
          const isArrow =
            key === "ArrowUp" ||
            key === "ArrowDown" ||
            key === "ArrowLeft" ||
            key === "ArrowRight";
          const isTab = key === "Tab";
          if (!isArrow && !isTab) return;

          e.preventDefault();

          const rows = api.numRows();
          const cols = api.numCols();
          if (rows <= 0 || cols <= 0) return true;

          if (isTab) {
            let next = ac;
            if (e.shiftKey) {
              if (ac.col > 0) {
                next = { row: ac.row, col: ac.col - 1 };
              } else if (ac.row > 0) {
                next = { row: ac.row - 1, col: cols - 1 };
              }
            } else if (ac.col < cols - 1) {
              next = { row: ac.row, col: ac.col + 1 };
            } else if (ac.row < rows - 1) {
              next = { row: ac.row + 1, col: 0 };
            }

            dragging = false;
            setSingle(next, api);
            return true;
          }

          const dr = key === "ArrowUp" ? -1 : key === "ArrowDown" ? 1 : 0;
          const dc = key === "ArrowLeft" ? -1 : key === "ArrowRight" ? 1 : 0;

          if (e.shiftKey) {
            const rangeAnchor = anchor ?? ac; // Initial shift anchor is current position
            const currentHead = head ?? ac;
            const nextHead = moveBy(currentHead, dr, dc, rows, cols);
            setRange(rangeAnchor, nextHead, api);
          } else {
            // Normal arrow: single cell move (reset anchor/head)
            const next = moveBy(ac, dr, dc, rows, cols);
            dragging = false;
            setSingle(next, api);
          }

          return true;
        }

        default:
          return;
      }
    },
  };
}
