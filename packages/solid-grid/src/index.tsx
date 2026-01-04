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

export interface CellPosition {
  row: number;
  col: number;
}

export interface CellRange {
  min: CellPosition;
  max: CellPosition;
}

export interface ClipboardData<T> {
  data: T[][];
  range: CellRange;
}

function isPositionInRange(pos: CellPosition, range: CellRange): boolean {
  return (
    pos.row >= range.min.row &&
    pos.row <= range.max.row &&
    pos.col >= range.min.col &&
    pos.col <= range.max.col
  );
}

function normalizeRange(pos1: CellPosition, pos2: CellPosition): CellRange {
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

export interface CellRenderContext<T> {
  /** Row index */
  row: number;

  /** Column index */
  col: number;

  /** Cell value */
  value: T;

  /** Is this the active cell (focused) */
  isActive: boolean;

  /** Is this cell currently selected */
  isSelected: boolean;

  /** Is this cell currently being edited */
  isEditing: boolean;

  /** Solid ref for scrolling, focusing, measuring, etc. */
  cellRef: HTMLTableCellElement | undefined;

  /** Enter editing mode for this cell */
  beginEdit: () => void;

  /** Commit edit with new value */
  commitEdit: (value: T) => void;

  /** Exit editing mode for this cell */
  cancelEditing: () => void;
}

export interface GridsheetProps<T> {
  /** 2D matrix of values */
  data: T[][];
  onDataChange?: (next: T[][]) => void;

  /** Renderer for each cell */
  renderCell: (ctx: CellRenderContext<T>) => JSX.Element;

  /** Currently focused cell */
  activeCell?: CellPosition | null;
  onActiveCellChange?: (pos: CellPosition | null) => void;

  /** Current selection range */
  selection?: CellRange | null;
  onSelectionChange?: (range: CellRange | null) => void;

  /** Is the active cell in editing mode */
  isEditing?: boolean;
  onIsEditingChange?: (isEditing: boolean) => void;

  /** Clipboard data (for copy/cut operations) */
  clipboard?: ClipboardData<T> | null;
  onClipboardChange?: (clipboard: ClipboardData<T> | null) => void;

  /** Called when copy is triggered. Required for copy to work. Return false to prevent clipboard update. Can be async */
  onCopy?: (
    data: T[][],
    range: CellRange,
  ) => boolean | undefined | Promise<boolean | undefined>;

  /** Called when cut is triggered. Required for cut to work. Return false to prevent clipboard update. Can be async */
  onCut?: (
    data: T[][],
    range: CellRange,
  ) => boolean | undefined | Promise<boolean | undefined>;

  /** Called when paste is triggered. Required for paste to work. Return modified data to apply changes. Can be async */
  onPaste?: (
    clipboardData: T[][],
    targetPosition: CellPosition,
  ) => T[][] | false | undefined | Promise<T[][] | false | undefined>;

  /** Called when delete is triggered. Required for delete to work */
  onDelete?: (range: CellRange) => void;

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

type SelectionMode = "cell" | "row" | "col";
const DEFAULT_SELECTION_MODE: SelectionMode = "cell";

export function Gridsheet<T>(props: GridsheetProps<T>): JSX.Element {
  const numRows = createMemo(() => props.data.length);
  const numCols = createMemo(() => (props.data[0] ? props.data[0].length : 0));

  const [innerActiveCell, setInnerActiveCell] =
    createSignal<CellPosition | null>(null);
  const activeCell = createMemo(() =>
    props.activeCell === undefined ? innerActiveCell() : props.activeCell,
  );
  const setActiveCell = (pos: CellPosition | null) => {
    // propsでactiveCellを管理している場合でも、内部stateを更新する
    // props.activeCellがundefinedに変更される可能性があるため
    setInnerActiveCell(pos);

    if (props.onActiveCellChange) {
      props.onActiveCellChange(pos);
    }
  };

  const isCellActive = (pos: CellPosition) => {
    const ac = activeCell();
    return ac !== null && ac.row === pos.row && ac.col === pos.col;
  };

  const [innerSelection, setInnerSelection] = createSignal<CellRange | null>(
    null,
  );
  const selection = createMemo(() =>
    props.selection === undefined ? innerSelection() : props.selection,
  );
  const setSelection = (range: CellRange | null) => {
    const normalizedRange = range ? normalizeRange(range.min, range.max) : null;
    // propsでselectionを管理している場合でも、内部stateを更新する
    // props.selectionがundefinedに変更される可能性があるため
    setInnerSelection(normalizedRange);

    if (props.onSelectionChange) {
      props.onSelectionChange(normalizedRange);
    }
  };

  const isCellSelected = (pos: CellPosition) => {
    const sel = selection();
    return sel !== null && isPositionInRange(pos, sel);
  };

  const isRowHeaderSelected = (rowIndex: number) => {
    const sel = selection();
    return sel !== null && rowIndex >= sel.min.row && rowIndex <= sel.max.row;
  };

  const isColHeaderSelected = (colIndex: number) => {
    const sel = selection();
    return sel !== null && colIndex >= sel.min.col && colIndex <= sel.max.col;
  };

  const [innerIsEditing, setInnerIsEditing] = createSignal<boolean>(false);
  const isEditing = createMemo(() =>
    props.isEditing === undefined ? innerIsEditing() : props.isEditing,
  );
  const setIsEditing = (editing: boolean) => {
    setInnerIsEditing(editing);

    if (props.onIsEditingChange) {
      props.onIsEditingChange(editing);
    }
  };

  const isCellEditing = (pos: CellPosition) => {
    return isEditing() && isCellActive(pos);
  };

  const [innerClipboard, setInnerClipboard] =
    createSignal<ClipboardData<T> | null>(null);
  const clipboard = createMemo(() =>
    props.clipboard === undefined ? innerClipboard() : props.clipboard,
  );
  const setClipboard = (data: ClipboardData<T> | null) => {
    setInnerClipboard(data);

    if (props.onClipboardChange) {
      props.onClipboardChange(data);
    }
  };

  const extractSelection = (range: CellRange): T[][] => {
    const result: T[][] = [];
    for (let r = range.min.row; r <= range.max.row; r++) {
      const row: T[] = [];
      for (let c = range.min.col; c <= range.max.col; c++) {
        const rowData = props.data[r];
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
  };

  const handleCopy = async () => {
    const sel = selection();
    if (!sel) return;

    if (!props.onCopy) return;

    const copiedData = extractSelection(sel);

    const result = await props.onCopy(copiedData, sel);
    if (result === false) return;

    setClipboard({ data: copiedData, range: sel });
  };

  const handleCut = async () => {
    const sel = selection();
    if (!sel) return;

    if (!props.onCut) return;

    const copiedData = extractSelection(sel);

    const result = await props.onCut(copiedData, sel);
    if (result === false) return;

    setClipboard({ data: copiedData, range: sel });
  };

  const handlePaste = async () => {
    const ac = activeCell();
    const clip = clipboard();
    if (!ac || !clip) return;

    if (props.onPaste) {
      const result = await props.onPaste(clip.data, ac);
      if (result === false) return;

      if (result && props.onDataChange) {
        props.onDataChange(result);
      }
    }
  };

  const handleDelete = () => {
    const sel = selection();
    if (!sel) return;

    if (props.onDelete) {
      props.onDelete(sel);
    }
  };

  const beginCellEdit = (pos: CellPosition) => {
    batch(() => {
      setIsEditing(true);
      setActiveCell(pos);
      setSelection(normalizeRange(pos, pos));
    });
  };

  const commitCellEdit = (pos: CellPosition, value: T) => {
    const nextData = props.data.map((row) => row.slice());

    const targetRow = nextData[pos.row];
    if (targetRow && pos.col >= 0 && pos.col < targetRow.length) {
      targetRow[pos.col] = value;
      if (props.onDataChange) {
        props.onDataChange(nextData);
      }
    }

    setIsEditing(false);
  };

  const cancelCellEdit = () => {
    setIsEditing(false);
  };

  const [isMouseDown, setIsMouseDown] = createSignal(false);
  const [selectionMode, setSelectionMode] = createSignal<SelectionMode>(
    DEFAULT_SELECTION_MODE,
  );
  const [selectionAnchor, setSelectionAnchor] =
    createSignal<CellPosition | null>(null);

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

  const handleMouseUp = () => {
    setIsMouseDown(false);
    setSelectionMode(DEFAULT_SELECTION_MODE);
    setSelectionAnchor(null);
    restoreTextSelectionAfterDrag();
  };
  onMount(() => {
    window.addEventListener("mouseup", handleMouseUp);
  });
  onCleanup(() => {
    window.removeEventListener("mouseup", handleMouseUp);
    restoreTextSelectionAfterDrag();
  });

  const handleMouseDownOnCell = (pos: CellPosition, e: MouseEvent) => {
    if (e.button !== 0) return;

    // 編集中のセルは選択操作を無効化し、編集状態を維持する
    if (isCellEditing(pos)) return;

    // ダブルクリック(2回目のmousedown)で即座に編集に入る
    if (e.detail === 2) {
      e.preventDefault();
      beginCellEdit(pos);
      return;
    }

    e.preventDefault();

    batch(() => {
      disableTextSelectionDuringDrag();
      setIsMouseDown(true);
      setSelectionMode("cell");
      setSelectionAnchor(pos);

      setIsEditing(false);
      setSelection(normalizeRange(pos, pos));
      setActiveCell(pos);
    });
  };
  const handleMouseOverOnCell = (pos: CellPosition, e: MouseEvent) => {
    // ドラッグされていない場合は何もしない
    if ((e.buttons & 1) === 0) return;

    batch(() => {
      if (!isMouseDown() || selectionMode() !== "cell") return;

      const start = selectionAnchor();
      if (start) {
        setSelection(normalizeRange(start, pos));
      } else {
        console.warn("selectionAnchor is null during mouse drag selection");
      }
    });
  };

  const handleMouseDownOnRowHeader = (rowIndex: number) => {
    if (numCols() === 0) {
      return;
    }

    batch(() => {
      disableTextSelectionDuringDrag();
      setIsMouseDown(true);
      setSelectionMode("row");
      const start: CellPosition = { row: rowIndex, col: 0 };
      const end: CellPosition = { row: rowIndex, col: numCols() - 1 };
      setSelectionAnchor(start);

      setIsEditing(false);
      setSelection(normalizeRange(start, end));
      setActiveCell(start);
    });
  };
  const handleMouseOverOnRowHeader = (rowIndex: number) => {
    batch(() => {
      if (!isMouseDown() || selectionMode() !== "row") return;

      const start = selectionAnchor();
      if (start) {
        const end: CellPosition = { row: rowIndex, col: numCols() - 1 };
        setSelection(normalizeRange(start, end));
      } else {
        console.warn("selectionAnchor is null during mouse drag selection");
      }
    });
  };

  const handleMouseDownOnColHeader = (colIndex: number) => {
    if (numRows() === 0) {
      return;
    }

    batch(() => {
      disableTextSelectionDuringDrag();
      setIsMouseDown(true);
      setSelectionMode("col");
      const start: CellPosition = { row: 0, col: colIndex };
      const end: CellPosition = { row: numRows() - 1, col: colIndex };
      setSelectionAnchor(start);

      setIsEditing(false);
      setSelection(normalizeRange(start, end));
      setActiveCell(start);
    });
  };
  const handleMouseOverOnColHeader = (colIndex: number) => {
    batch(() => {
      if (!isMouseDown() || selectionMode() !== "col") return;

      const start = selectionAnchor();
      if (start) {
        const end: CellPosition = { row: numRows() - 1, col: colIndex };
        setSelection(normalizeRange(start, end));
      } else {
        console.warn("selectionAnchor is null during mouse drag selection");
      }
    });
  };

  const handleClickOnCorner = () => {
    if (numCols() === 0 || numRows() === 0) {
      return;
    }

    batch(() => {
      setIsEditing(false);
      setSelection(
        normalizeRange(
          { row: 0, col: 0 },
          { row: numRows() - 1, col: numCols() - 1 },
        ),
      );
      setActiveCell({ row: 0, col: 0 });
    });
  };

  const navigate = (
    deltaRow: number,
    deltaCol: number,
    isSelection: boolean,
  ) => {
    const ac = activeCell();
    if (!ac) return;

    if (isSelection) {
      let anchor = selectionAnchor();
      if (!anchor) {
        anchor = ac;
        setSelectionAnchor(anchor);
      }

      const sel = selection();
      let headRow = anchor.row;
      let headCol = anchor.col;

      if (sel) {
        headRow = sel.min.row === anchor.row ? sel.max.row : sel.min.row;
        headCol = sel.min.col === anchor.col ? sel.max.col : sel.min.col;
      }

      const nextHeadRow = Math.max(
        0,
        Math.min(numRows() - 1, headRow + deltaRow),
      );
      const nextHeadCol = Math.max(
        0,
        Math.min(numCols() - 1, headCol + deltaCol),
      );

      setSelection(
        normalizeRange(anchor, { row: nextHeadRow, col: nextHeadCol }),
      );
    } else {
      const nextRow = Math.max(0, Math.min(numRows() - 1, ac.row + deltaRow));
      const nextCol = Math.max(0, Math.min(numCols() - 1, ac.col + deltaCol));
      const nextPos = { row: nextRow, col: nextCol };

      setActiveCell(nextPos);
      setSelection(normalizeRange(nextPos, nextPos));
      setSelectionAnchor(null);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.isComposing) return;

    // 編集中のキー操作はrenderCell側で処理する
    if (isEditing()) return;

    const ac = activeCell();
    if (!ac) return;

    switch (e.key) {
      case "ArrowUp":
        e.preventDefault();
        navigate(-1, 0, e.shiftKey);
        break;
      case "ArrowDown":
        e.preventDefault();
        navigate(1, 0, e.shiftKey);
        break;
      case "ArrowLeft":
        e.preventDefault();
        navigate(0, -1, e.shiftKey);
        break;
      case "ArrowRight":
        e.preventDefault();
        navigate(0, 1, e.shiftKey);
        break;
      case "Tab":
        e.preventDefault();
        navigate(0, e.shiftKey ? -1 : 1, false);
        break;
      case "Enter":
        e.preventDefault();
        beginCellEdit(ac);
        break;
      case "c":
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          handleCopy();
        }
        break;
      case "x":
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          handleCut();
        }
        break;
      case "v":
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          handlePaste();
        }
        break;
      case "Delete":
      case "Backspace":
        e.preventDefault();
        handleDelete();
        break;

      default:
        break;
    }
  };

  const cellRefs = new Map<string, HTMLElement>();
  const getCellKey = (pos: CellPosition) => `${pos.row}:${pos.col}`;
  createEffect(() => {
    if (isEditing()) return;
    const ac = activeCell();
    if (ac) {
      const el = cellRefs.get(getCellKey(ac));
      el?.focus();
    }
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
            onClick={handleClickOnCorner}
            class={props.classes?.corner}
          ></th>
          <Index each={Array.from({ length: numCols() })}>
            {(_, colIndex) => (
              <ColHeader
                index={colIndex}
                isSelected={isColHeaderSelected(colIndex)}
                onMouseDown={handleMouseDownOnColHeader}
                onMouseOver={handleMouseOverOnColHeader}
                class={props.classes?.colHeader}
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
                onMouseDown={handleMouseDownOnRowHeader}
                onMouseOver={handleMouseOverOnRowHeader}
                class={props.classes?.rowHeader}
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
                    beginEdit={beginCellEdit}
                    commitEdit={commitCellEdit}
                    cancelEditing={cancelCellEdit}
                    setActiveCell={setActiveCell}
                    setSelection={setSelection}
                    renderCell={props.renderCell}
                    onMouseDown={handleMouseDownOnCell}
                    onMouseOver={handleMouseOverOnCell}
                    registerCellRef={(rowPos, colPos, el) => {
                      cellRefs.set(
                        getCellKey({ row: rowPos, col: colPos }),
                        el,
                      );
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

  onMouseDown: (rowIndex: number) => void;
  onMouseOver: (rowIndex: number) => void;

  class?: string | ((ctx: { rowIndex: number; isSelected: boolean }) => string);
}

function getRowLabel(rowIndex: number): string {
  return `${rowIndex + 1}`;
}

function RowHeader(props: RowHeaderProps) {
  return (
    // biome-ignore lint/a11y/useKeyWithMouseEvents: 親のtableでキー操作を処理している
    <th
      data-slot="gridsheet-rowheader"
      onMouseDown={() => props.onMouseDown(props.index)}
      onMouseOver={() => props.onMouseOver(props.index)}
      class={
        typeof props.class === "function"
          ? props.class({ rowIndex: props.index, isSelected: props.isSelected })
          : props.class
      }
      data-selected={props.isSelected || undefined}
    >
      {getRowLabel(props.index)}
    </th>
  );
}

interface ColHeaderProps {
  index: number;
  isSelected: boolean;

  onMouseDown: (colIndex: number) => void;
  onMouseOver: (colIndex: number) => void;

  class?: string | ((ctx: { colIndex: number; isSelected: boolean }) => string);
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

function ColHeader(props: ColHeaderProps) {
  return (
    // biome-ignore lint/a11y/useKeyWithMouseEvents: 親のtableでキー操作を処理している
    <th
      data-slot="gridsheet-colheader"
      onMouseDown={() => props.onMouseDown(props.index)}
      onMouseOver={() => props.onMouseOver(props.index)}
      class={
        typeof props.class === "function"
          ? props.class({ colIndex: props.index, isSelected: props.isSelected })
          : props.class
      }
      data-selected={props.isSelected || undefined}
    >
      {getColLabel(props.index)}
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

  setActiveCell?: (pos: CellPosition) => void;
  setSelection?: (range: CellRange | null) => void;

  onMouseDown: (pos: CellPosition, e: MouseEvent) => void;
  onMouseOver: (pos: CellPosition, e: MouseEvent) => void;

  registerCellRef: (row: number, col: number, el: HTMLTableCellElement) => void;

  renderCell: (ctx: CellRenderContext<T>) => JSX.Element;

  class?: string | ((ctx: CellRenderContext<T>) => string);
}

function Cell<T>(props: CellProps<T>) {
  let cellRef!: HTMLTableCellElement;

  const beginEdit = () => props.beginEdit({ row: props.row, col: props.col });
  const commitEdit = (value: T) => {
    props.commitEdit({ row: props.row, col: props.col }, value);
  };
  const cancelEditing = () => props.cancelEditing();

  const handleMouseDown = (e: MouseEvent) => {
    props.onMouseDown({ row: props.row, col: props.col }, e);
  };
  const handleMouseOver = (e: MouseEvent) => {
    props.onMouseOver({ row: props.row, col: props.col }, e);
  };
  const handleDoubleClick = (e: MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    if (!props.isEditing) {
      beginEdit();
    }
  };

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
    } else {
      return props.class;
    }
  });

  return (
    // biome-ignore lint/a11y/useKeyWithMouseEvents: 親のtableでキー操作を処理している
    <td
      data-slot="gridsheet-cell"
      ref={(el) => {
        cellRef = el;
        props.registerCellRef(props.row, props.col, el);
      }}
      onMouseDown={handleMouseDown}
      onMouseOver={handleMouseOver}
      onDblClick={handleDoubleClick}
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

        cellRef: cellRef,

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
