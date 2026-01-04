# API Reference

## Component

### `Gridsheet<T>`

The main grid component. `T` is the type of each cell value.

```tsx
import { Gridsheet } from "@shiguri/solid-grid";

<Gridsheet<string> data={data} renderCell={...} />
```

> **Note**: The data structure is a 2D matrix (`T[][]`), not an array of row objects.

## Props

| Prop                 | Type                                         | Required | Description                        |
| -------------------- | -------------------------------------------- | -------- | ---------------------------------- |
| `data`               | `T[][]`                                      | ✅       | 2D matrix of cell values           |
| `renderCell`         | `(ctx: CellRenderContext<T>) => JSX.Element` | ✅       | Render function for each cell      |
| `onDataChange`       | `(next: T[][]) => void`                      |          | Callback when data changes         |
| `activeCell`         | `CellPosition \| null`                       |          | Controlled active cell             |
| `onActiveCellChange` | `(pos: CellPosition \| null) => void`        |          | Callback when active cell changes  |
| `selection`          | `CellRange \| null`                          |          | Controlled selection range         |
| `onSelectionChange`  | `(range: CellRange \| null) => void`         |          | Callback when selection changes    |
| `isEditing`          | `boolean`                                    |          | Controlled editing state           |
| `onIsEditingChange`  | `(isEditing: boolean) => void`               |          | Callback when editing changes      |
| `clipboard`          | `ClipboardData<T> \| null`                   |          | Controlled clipboard state         |
| `onClipboardChange`  | `(clipboard: ClipboardData<T> \| null) => void` |       | Callback when clipboard changes    |
| `onCopy`             | `(data: T[][], range: CellRange) => boolean \| undefined` |          | Called on copy (Ctrl+C). Return `false` to prevent. Can be async for system clipboard |
| `onCut`              | `(data: T[][], range: CellRange) => boolean \| undefined` |          | Called on cut (Ctrl+X). Return `false` to prevent. Can be async for system clipboard |
| `onPaste`            | `(data: T[][], pos: CellPosition) => T[][] \| false \| undefined` |          | Called on paste (Ctrl+V). Return new data to apply, or `false` to prevent. Can be async for system clipboard. **Required for paste to work** |
| `onDelete`           | `(range: CellRange) => void`                 |          | Called on delete (Delete/Backspace). **Required for delete to work** |
| `class`              | `string`                                     |          | CSS class for the table            |
| `style`              | `JSX.CSSProperties \| string`                |          | Inline styles                      |
| `classes`            | `GridClasses<T>`                             |          | CSS classes for various grid parts |

### GridClasses\<T\>

| Property    | Type                                                            | Description           |
| ----------- | --------------------------------------------------------------- | --------------------- |
| `cell`      | `string \| ((ctx: CellRenderContext<T>) => string)`             | Class for data cells  |
| `row`       | `string \| ((ctx: { rowIndex: number }) => string)`             | Class for table rows  |
| `rowHeader` | `string \| ((ctx: { rowIndex: number; isSelected }) => string)` | Class for row headers |
| `colHeader` | `string \| ((ctx: { colIndex: number; isSelected }) => string)` | Class for col headers |
| `corner`    | `string`                                                        | Class for corner cell |

---

## Interfaces

### CellPosition

```typescript
interface CellPosition {
  row: number; // 0-indexed
  col: number; // 0-indexed
}
```

### CellRange

```typescript
interface CellRange {
  min: CellPosition; // Top-left
  max: CellPosition; // Bottom-right
}
```

### ClipboardData\<T\>

```typescript
interface ClipboardData<T> {
  data: T[][];       // Copied cell data
  range: CellRange;  // Source range
}
```

### CellRenderContext\<T\>

Context passed to the `renderCell` function:

```typescript
interface CellRenderContext<T> {
  row: number; // Row index
  col: number; // Column index
  value: T; // Cell value

  isActive: boolean; // Is this the focused cell
  isSelected: boolean; // Is this cell selected
  isEditing: boolean; // Is this cell being edited

  cellRef: HTMLTableCellElement | undefined;

  beginEdit: () => void; // Enter edit mode
  commitEdit: (value: T) => void; // Save and exit edit mode
  cancelEditing: () => void; // Exit without saving
}
```

---

## Data Attributes

Use these selectors for CSS styling:

| Element       | Selector                            |
| ------------- | ----------------------------------- |
| Table         | `[data-slot="gridsheet"]`           |
| Cell          | `[data-slot="gridsheet-cell"]`      |
| Row Header    | `[data-slot="gridsheet-rowheader"]` |
| Column Header | `[data-slot="gridsheet-colheader"]` |
| Corner        | `[data-slot="gridsheet-corner"]`    |

### Cell State Attributes

| Attribute       | Description                   |
| --------------- | ----------------------------- |
| `data-selected` | Present when cell is selected |
| `data-active`   | Present when cell is focused  |
| `data-editing`  | Present when cell is editing  |

---

## Header Labels

- **Columns**: A, B, C, ..., Z, AA, AB, ... (Excel-style)
- **Rows**: 1, 2, 3, ... (1-indexed display)
