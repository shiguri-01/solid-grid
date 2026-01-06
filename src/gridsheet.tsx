import {
  batch,
  createEffect,
  createMemo,
  createSignal,
  For,
  Index,
  onCleanup,
  onMount,
} from "solid-js";
import type { JSX } from "solid-js/jsx-runtime";

/** Zero-based cell position. */
export type CellPosition = {
  row: number;
  col: number;
};

/** Inclusive range of cells. */
export type CellRange = {
  min: CellPosition;
  max: CellPosition;
};

function isPositionInRange(pos: CellPosition, range: CellRange): boolean {
  return (
    pos.row >= range.min.row &&
    pos.row <= range.max.row &&
    pos.col >= range.min.col &&
    pos.col <= range.max.col
  );
}

/** Normalize two positions into an inclusive range. */
export function normalizeRange(
  pos1: CellPosition,
  pos2: CellPosition,
): CellRange {
  return {
    min: {
      row: Math.min(pos1.row, pos2.row),
      col: Math.min(pos1.col, pos2.col),
    },
    max: {
      row: Math.max(pos1.row, pos2.row),
      col: Math.max(pos1.col, pos2.col),
    },
  };
}

/** Render-time context for a single cell. */
export interface CellRenderContext<T> {
  row: number;
  col: number;
  value: T;

  isActive: boolean;
  isSelected: boolean;
  isEditing: boolean;

  cellRef: HTMLTableCellElement | undefined;

  beginEdit: () => void;
  commitEdit: (value: T) => void;
  cancelEditing: () => void;
}

/** Events emitted from Gridsheet to plugins/handlers. */
export type GridEvent =
  | { type: "cell:pointerdown"; pos: CellPosition; e: MouseEvent }
  | { type: "cell:pointerover"; pos: CellPosition; e: MouseEvent }
  | { type: "cell:dblclick"; pos: CellPosition; e: MouseEvent }
  | { type: "key:down"; e: KeyboardEvent }
  | { type: "corner:click"; e: MouseEvent }
  | { type: "rowheader:pointerdown"; row: number; e: MouseEvent }
  | { type: "rowheader:pointerover"; row: number; e: MouseEvent }
  | { type: "colheader:pointerdown"; col: number; e: MouseEvent }
  | { type: "colheader:pointerover"; col: number; e: MouseEvent }
  | { type: "pointer:up"; e: PointerEvent | MouseEvent };

/** Return true to stop further handling. */
export type GridEventHandler<T> = (
  ev: GridEvent,
  api: GridApi<T>,
) => boolean | undefined;

/** Props for the Gridsheet component. */
export interface GridsheetProps<T> {
  data: T[][];
  /** Apply patches to external data store. */
  onCellsChange?: (patches: CellPatch<T>[]) => void;

  renderCell: (ctx: CellRenderContext<T>) => JSX.Element;
  renderRowHeader?: (ctx: {
    index: number;
    isSelected: boolean;
  }) => JSX.Element;
  renderColHeader?: (ctx: {
    index: number;
    isSelected: boolean;
  }) => JSX.Element;

  activeCell?: CellPosition | null;
  onActiveCellChange?: (pos: CellPosition | null) => void;

  selection?: CellRange | null;
  onSelectionChange?: (range: CellRange | null) => void;

  isEditing?: boolean;
  onIsEditingChange?: (isEditing: boolean) => void;

  /**
   * 本体は仕様を持たず “イベントを投げる” のが仕事。
   * 既定の挙動は plugin 側で組み立てる
   */
  onEvent?: GridEventHandler<T>;

  ref?: HTMLTableElement | ((el: HTMLTableElement) => void) | undefined;
  class?: string;
  style?: JSX.CSSProperties | string;
  classes?: {
    cell?: string | ((ctx: CellRenderContext<T>) => string);
    row?: string | ((ctx: { rowIndex: number }) => string);
    rowHeader?:
      | string
      | ((ctx: { rowIndex: number; isSelected: boolean }) => string);
    colHeader?:
      | string
      | ((ctx: { colIndex: number; isSelected: boolean }) => string);
    corner?: string;
    header?: string;
    body?: string;
  };
}

function createControllable<T>(
  propsValue: () => T | undefined,
  onChange?: (v: T) => void,
  initial?: T,
) {
  const [inner, setInner] = createSignal<T>(initial as T);
  const value = createMemo(() =>
    propsValue() === undefined ? inner() : (propsValue() as T),
  );
  const set = (v: T) => {
    setInner(() => v);
    onChange?.(v);
  };
  return [value, set] as const;
}

/** Patch for a single cell update. */
export type CellPatch<T> = { pos: CellPosition; value: T };
/** API exposed to plugins and external handlers. */
export type GridApi<T> = {
  // state readers
  numRows: () => number;
  numCols: () => number;
  activeCell: () => CellPosition | null;
  selection: () => CellRange | null;
  isEditing: () => boolean;

  // commands
  setActiveCell: (pos: CellPosition | null) => void;
  setSelection: (range: CellRange | null) => void;
  beginEdit: (pos: CellPosition) => void;
  cancelEdit: () => void;
  commitEdit: (pos: CellPosition, value: T) => void;

  updateCells: (patches: CellPatch<T>[]) => void;
};

function createGridApi<T>(props: GridsheetProps<T>): GridApi<T> {
  const numRows = createMemo(() => props.data.length);
  const numCols = createMemo(() => props.data[0]?.length ?? 0);

  const [activeCell, setActiveCell] = createControllable<CellPosition | null>(
    () => props.activeCell,
    props.onActiveCellChange,
    null,
  );

  const [selection, setSelectionRaw] = createControllable<CellRange | null>(
    () => props.selection,
    props.onSelectionChange,
    null,
  );

  const setSelection = (range: CellRange | null) => {
    setSelectionRaw(range ? normalizeRange(range.min, range.max) : null);
  };

  const [isEditing, setIsEditing] = createControllable<boolean>(
    () => props.isEditing,
    props.onIsEditingChange,
    false,
  );

  const updateCells = (patches: CellPatch<T>[]) => {
    props.onCellsChange?.(patches);
  };

  const beginEdit = (pos: CellPosition) => {
    batch(() => {
      setIsEditing(true);
      setActiveCell(pos);
      setSelection(normalizeRange(pos, pos));
    });
  };

  const cancelEdit = () => setIsEditing(false);

  const commitEdit = (pos: CellPosition, value: T) => {
    updateCells([{ pos, value }]);
    setIsEditing(false);
  };

  return {
    numRows,
    numCols,
    activeCell,
    selection,
    isEditing,

    setActiveCell,
    setSelection,
    beginEdit,
    cancelEdit,
    commitEdit,

    updateCells,
  };
}

export function Gridsheet<T>(props: GridsheetProps<T>): JSX.Element {
  const api = createGridApi(props);

  const emit = (ev: GridEvent) => {
    props.onEvent?.(ev, api);
  };

  const isCellActive = (pos: CellPosition) => {
    const ac = api.activeCell();
    return ac !== null && ac.row === pos.row && ac.col === pos.col;
  };

  const isCellSelected = (pos: CellPosition) => {
    const sel = api.selection();
    return sel !== null && isPositionInRange(pos, sel);
  };

  const isRowHeaderSelected = (rowIndex: number) => {
    const sel = api.selection();
    return sel !== null && rowIndex >= sel.min.row && rowIndex <= sel.max.row;
  };

  const isColHeaderSelected = (colIndex: number) => {
    const sel = api.selection();
    return sel !== null && colIndex >= sel.min.col && colIndex <= sel.max.col;
  };

  const renderRowHeader = props.renderRowHeader ?? defaultRenderRowHeader;
  const renderColHeader = props.renderColHeader ?? defaultRenderColHeader;

  const isCellEditing = (pos: CellPosition) =>
    api.isEditing() && isCellActive(pos);

  const cellRefs = new Map<string, HTMLElement>();
  const getCellKey = (pos: CellPosition) => `${pos.row}:${pos.col}`;
  createEffect(() => {
    if (api.isEditing()) return;
    const ac = api.activeCell();
    if (!ac) return;
    const el = cellRefs.get(getCellKey(ac));
    el?.focus();
  });

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.isComposing) return;
    // 編集中のキー操作は renderCell 側に委ねる
    if (api.isEditing()) return;
    emit({ type: "key:down", e });
  };

  const onUp = (e: PointerEvent | MouseEvent) =>
    emit({ type: "pointer:up", e });
  onMount(() => {
    window.addEventListener("pointerup", onUp);
  });
  onCleanup(() => {
    window.removeEventListener("pointerup", onUp);
  });

  return (
    <table
      data-slot="gridsheet"
      tabIndex={-1}
      onKeyDown={handleKeyDown}
      ref={props.ref}
      class={props.class}
      style={props.style}
    >
      <thead data-slot="gridsheet-header" class={props.classes?.header}>
        <tr data-slot="gridsheet-row">
          <th
            data-slot="gridsheet-corner"
            onClick={(e) => emit({ type: "corner:click", e })}
            class={props.classes?.corner}
          ></th>

          <Index each={Array.from({ length: api.numCols() })}>
            {(_, colIndex) => (
              <ColHeader
                index={colIndex}
                isSelected={isColHeaderSelected(colIndex)}
                onMouseDown={(col, e) =>
                  emit({ type: "colheader:pointerdown", col, e })
                }
                onMouseOver={(col, e) =>
                  emit({ type: "colheader:pointerover", col, e })
                }
                class={props.classes?.colHeader}
                renderHeader={renderColHeader}
              />
            )}
          </Index>
        </tr>
      </thead>

      <tbody data-slot="gridsheet-body" class={props.classes?.body}>
        <For each={props.data}>
          {(row, rowIndex) => (
            <tr
              data-slot="gridsheet-row"
              class={
                typeof props.classes?.row === "function"
                  ? props.classes?.row({ rowIndex: rowIndex() })
                  : props.classes?.row
              }
            >
              <RowHeader
                index={rowIndex()}
                isSelected={isRowHeaderSelected(rowIndex())}
                onMouseDown={(r, e) =>
                  emit({ type: "rowheader:pointerdown", row: r, e })
                }
                onMouseOver={(r, e) =>
                  emit({ type: "rowheader:pointerover", row: r, e })
                }
                class={props.classes?.rowHeader}
                renderHeader={renderRowHeader}
              />

              <For each={row}>
                {(cell, colIndex) => (
                  <Cell
                    row={rowIndex()}
                    col={colIndex()}
                    value={cell}
                    isActive={isCellActive({
                      row: rowIndex(),
                      col: colIndex(),
                    })}
                    isEditing={isCellEditing({
                      row: rowIndex(),
                      col: colIndex(),
                    })}
                    isSelected={isCellSelected({
                      row: rowIndex(),
                      col: colIndex(),
                    })}
                    beginEdit={(pos) => api.beginEdit(pos)}
                    commitEdit={(pos, value) => api.commitEdit(pos, value)}
                    cancelEditing={() => api.cancelEdit()}
                    renderCell={props.renderCell}
                    onMouseDown={(pos, e) =>
                      emit({ type: "cell:pointerdown", pos, e })
                    }
                    onMouseOver={(pos, e) =>
                      emit({ type: "cell:pointerover", pos, e })
                    }
                    onDoubleClick={(pos, e) =>
                      emit({ type: "cell:dblclick", pos, e })
                    }
                    registerCellRef={(r, c, el) => {
                      cellRefs.set(getCellKey({ row: r, col: c }), el);
                    }}
                    class={props.classes?.cell}
                  />
                )}
              </For>
            </tr>
          )}
        </For>
      </tbody>
    </table>
  );
}

interface RowHeaderProps {
  index: number;
  isSelected: boolean;
  onMouseDown: (rowIndex: number, e: MouseEvent) => void;
  onMouseOver: (rowIndex: number, e: MouseEvent) => void;
  class?: string | ((ctx: { rowIndex: number; isSelected: boolean }) => string);
  renderHeader: (ctx: { index: number; isSelected: boolean }) => JSX.Element;
}

function getRowLabel(rowIndex: number): string {
  return `${rowIndex + 1}`;
}

function defaultRenderRowHeader(ctx: { index: number; isSelected: boolean }) {
  return <>{getRowLabel(ctx.index)}</>;
}

function RowHeader(props: RowHeaderProps) {
  return (
    // biome-ignore lint/a11y/useKeyWithMouseEvents: header drag selection is mouse-only
    <th
      data-slot="gridsheet-rowheader"
      onMouseDown={(e) => props.onMouseDown(props.index, e)}
      onMouseOver={(e) => props.onMouseOver(props.index, e)}
      class={
        typeof props.class === "function"
          ? props.class({ rowIndex: props.index, isSelected: props.isSelected })
          : props.class
      }
      data-selected={props.isSelected || undefined}
    >
      {props.renderHeader({ index: props.index, isSelected: props.isSelected })}
    </th>
  );
}

interface ColHeaderProps {
  index: number;
  isSelected: boolean;
  onMouseDown: (colIndex: number, e: MouseEvent) => void;
  onMouseOver: (colIndex: number, e: MouseEvent) => void;
  class?: string | ((ctx: { colIndex: number; isSelected: boolean }) => string);
  renderHeader: (ctx: { index: number; isSelected: boolean }) => JSX.Element;
}

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
function getColLabel(colIndex: number): string {
  let label = "";
  let n = colIndex + 1;
  while (n > 0) {
    const rem = (n - 1) % 26;
    label = ALPHABET[rem] + label;
    n = Math.floor((n - 1) / 26);
  }
  return label;
}

function defaultRenderColHeader(ctx: { index: number; isSelected: boolean }) {
  return <>{getColLabel(ctx.index)}</>;
}

function ColHeader(props: ColHeaderProps) {
  return (
    // biome-ignore lint/a11y/useKeyWithMouseEvents: header drag selection is mouse-only
    <th
      data-slot="gridsheet-colheader"
      onMouseDown={(e) => props.onMouseDown(props.index, e)}
      onMouseOver={(e) => props.onMouseOver(props.index, e)}
      class={
        typeof props.class === "function"
          ? props.class({ colIndex: props.index, isSelected: props.isSelected })
          : props.class
      }
      data-selected={props.isSelected || undefined}
    >
      {props.renderHeader({ index: props.index, isSelected: props.isSelected })}
    </th>
  );
}

interface CellProps<T> {
  row: number;
  col: number;
  value: T;

  isSelected: boolean;
  isActive: boolean;
  isEditing: boolean;

  beginEdit: (pos: CellPosition) => void;
  commitEdit: (pos: CellPosition, value: T) => void;
  cancelEditing: () => void;

  onMouseDown: (pos: CellPosition, e: MouseEvent) => void;
  onMouseOver: (pos: CellPosition, e: MouseEvent) => void;
  onDoubleClick: (pos: CellPosition, e: MouseEvent) => void;

  registerCellRef: (row: number, col: number, el: HTMLTableCellElement) => void;

  renderCell: (ctx: CellRenderContext<T>) => JSX.Element;

  class?: string | ((ctx: CellRenderContext<T>) => string);
}

function Cell<T>(props: CellProps<T>) {
  let cellRef!: HTMLTableCellElement;

  const beginEdit = () => props.beginEdit({ row: props.row, col: props.col });
  const commitEdit = (value: T) =>
    props.commitEdit({ row: props.row, col: props.col }, value);
  const cancelEditing = () => props.cancelEditing();

  const className = createMemo(() => {
    if (typeof props.class === "function") {
      return props.class({
        row: props.row,
        col: props.col,
        value: props.value,
        isSelected: props.isSelected,
        isActive: props.isActive,
        isEditing: props.isEditing,
        cellRef,
        beginEdit,
        commitEdit,
        cancelEditing,
      });
    }
    return props.class;
  });

  return (
    // biome-ignore lint/a11y/useKeyWithMouseEvents: 親のtableでキー操作を処理している
    <td
      data-slot="gridsheet-cell"
      ref={(el) => {
        cellRef = el;
        props.registerCellRef(props.row, props.col, el);
      }}
      onMouseDown={(e) =>
        props.onMouseDown({ row: props.row, col: props.col }, e)
      }
      onMouseOver={(e) =>
        props.onMouseOver({ row: props.row, col: props.col }, e)
      }
      onDblClick={(e) =>
        props.onDoubleClick({ row: props.row, col: props.col }, e)
      }
      tabIndex={-1}
      class={className()}
      data-row={props.row}
      data-col={props.col}
      data-selected={props.isSelected || undefined}
      data-active={props.isActive || undefined}
      data-editing={props.isEditing || undefined}
    >
      {props.renderCell({
        row: props.row,
        col: props.col,
        value: props.value,

        cellRef,

        isSelected: props.isSelected,
        isActive: props.isActive,
        isEditing: props.isEditing,

        beginEdit,
        commitEdit,
        cancelEditing,
      })}
    </td>
  );
}
