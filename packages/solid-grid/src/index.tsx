import {
  batch,
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

  /** Set the value of this cell */
  setValue: (value: T) => void;

  /** Exit editing mode for this cell */
  stopEditing: () => void;
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

  const handleFocusOnCell = (pos: CellPosition) => {
    setActiveCell(pos);
  };

  const beginCellEdit = (pos: CellPosition) => {
    batch(() => {
      setIsEditing(true);
      setActiveCell(pos);
      setSelection(normalizeRange(pos, pos));
    });
  };

  const setCellValue = (pos: CellPosition, value: T) => {
    const nextData = props.data.map((row) => row.slice());

    const targetRow = nextData[pos.row];
    if (targetRow && pos.col >= 0 && pos.col < targetRow.length) {
      targetRow[pos.col] = value;
      if (props.onDataChange) {
        props.onDataChange(nextData);
      }
    }
  };

  const stopCellEdit = () => {
    setIsEditing(false);
  };

  const [isMouseDown, setIsMouseDown] = createSignal(false);
  const [selectionMode, setSelectionMode] = createSignal<SelectionMode>(
    DEFAULT_SELECTION_MODE,
  );
  const [selectionAnchor, setSelectionAnchor] =
    createSignal<CellPosition | null>(null);

  const handleMouseUp = () => {
    setIsMouseDown(false);
    setSelectionMode(DEFAULT_SELECTION_MODE);
    setSelectionAnchor(null);
  };
  onMount(() => {
    window.addEventListener("mouseup", handleMouseUp);
  });
  onCleanup(() => {
    window.removeEventListener("mouseup", handleMouseUp);
  });

  const handleMouseDownOnCell = (pos: CellPosition) => {
    batch(() => {
      setIsMouseDown(true);
      setSelectionMode("cell");
      setSelectionAnchor(pos);

      setIsEditing(false);
      setSelection(normalizeRange(pos, pos));
      setActiveCell(pos);
    });
  };
  const handleMouseOverOnCell = (pos: CellPosition) => {
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
    batch(() => {
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
    batch(() => {
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
    batch(() => {
      if (numCols() === 0 || numRows() === 0) return;
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

  return (
    <table
      data-slot="gridsheet"
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
                    update={setCellValue}
                    stopEditing={stopCellEdit}
                    setActiveCell={setActiveCell}
                    setSelection={setSelection}
                    renderCell={props.renderCell}
                    onMouseDown={handleMouseDownOnCell}
                    onMouseOver={handleMouseOverOnCell}
                    onFocus={handleFocusOnCell}
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

function RowHeader(props: RowHeaderProps) {
  return (
    // biome-ignore lint/a11y/useKeyWithMouseEvents: キーボード操作は未対応
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
      {props.index + 1}
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

function ColHeader(props: ColHeaderProps) {
  return (
    // biome-ignore lint/a11y/useKeyWithMouseEvents: キーボード操作は未対応
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
      {colIndexToLabel(props.index)}
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
  update: (pos: CellPosition, value: T) => void;
  stopEditing: () => void;

  setActiveCell?: (pos: CellPosition) => void;
  setSelection?: (range: CellRange | null) => void;

  onMouseDown: (pos: CellPosition) => void;
  onMouseOver: (pos: CellPosition) => void;
  onFocus: (pos: CellPosition) => void;

  renderCell: (ctx: CellRenderContext<T>) => JSX.Element;

  class?: string | ((ctx: CellRenderContext<T>) => string);
}

function Cell<T>(props: CellProps<T>) {
  let cellRef: HTMLTableCellElement | undefined;

  const beginEdit = () => props.beginEdit({ row: props.row, col: props.col });
  const setValue = (value: T) =>
    props.update({ row: props.row, col: props.col }, value);
  const stopEditing = () => props.stopEditing();

  const handleMouseDown = () => {
    props.onMouseDown({ row: props.row, col: props.col });
  };
  const handleMouseOver = () => {
    props.onMouseOver({ row: props.row, col: props.col });
  };
  const handleDoubleClick = () => {
    beginEdit();
  };
  const handleFocus = () => {
    props.onFocus({ row: props.row, col: props.col });
  };
  const handleBlur = () => {
    if (props.isEditing) {
      stopEditing();
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
        cellRef: cellRef,
        beginEdit: beginEdit,
        setValue: setValue,
        stopEditing: stopEditing,
      });
    } else {
      return props.class;
    }
  });

  return (
    <td
      data-slot="gridsheet-cell"
      ref={cellRef}
      onMouseDown={handleMouseDown}
      onMouseOver={handleMouseOver}
      onFocus={handleFocus}
      onDblClick={handleDoubleClick}
      onBlur={handleBlur}
      // biome-ignore lint/a11y/noNoninteractiveTabindex: タブでセル移動できるようにするため
      tabIndex={0}
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

        beginEdit: beginEdit,
        setValue: setValue,
        stopEditing: stopEditing,
      })}
    </td>
  );
}

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
function colIndexToLabel(index: number): string {
  let label = "";
  let n = index + 1;
  while (n > 0) {
    const rem = (n - 1) % 26;
    label = ALPHABET[rem] + label;
    n = Math.floor((n - 1) / 26);
  }
  return label;
}
