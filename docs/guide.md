# Solid Grid Guide

> **Work in progress**: The API is still evolving and may include breaking changes.

## 1. Overview

Solid Grid is a small, event-driven grid component for SolidJS. It is designed
for **T[][] (matrix)** data and is not optimized for arrays of objects. If you
prefer object-based tables, TanStack Table is a great fit.

## 2. Installation

```bash
bun add @shiguri/solid-grid
```

Peer dependency:

- `solid-js`

## 3. Quick Start

```tsx
import { createSignal } from "solid-js";
import {
  Gridsheet,
  createPluginHost,
  selectionPlugin,
  editingPlugin,
} from "@shiguri/solid-grid";

function App() {
  const [data, setData] = createSignal([
    ["A1", "B1"],
    ["A2", "B2"],
  ]);

  const plugins = createPluginHost([
    selectionPlugin(),
    editingPlugin({ triggerKeys: ["Enter"] }),
  ]);

  return (
    <Gridsheet
      data={data()}
      onCellsChange={(patches) =>
        setData((prev) => {
          const next = prev.map((row) => row.slice());
          for (const { pos, value } of patches) {
            next[pos.row][pos.col] = value;
          }
          return next;
        })
      }
      renderCell={(ctx) => <span>{ctx.value}</span>}
      onEvent={plugins.onEvent}
    />
  );
}
```

## 4. Core Concepts

- **Data**: `T[][]` matrix (arrays of objects are not a primary target).
- **Positions**: `CellPosition` with `row`/`col` (0-based).
- **Ranges**: `CellRange` with `min`/`max` (inclusive).
- **Edits**: Emitted as `CellPatch[]` via `onCellsChange`.
- **Events**: `GridEvent` emitted to plugins or external handlers.

## 5. Core API Reference (Summary)

### Gridsheet

- `data: T[][]`
- `onCellsChange?: (patches: CellPatch<T>[]) => void`
- `renderCell: (ctx: CellRenderContext<T>) => JSX.Element`
- `renderRowHeader? / renderColHeader?`
- `activeCell? / onActiveCellChange?`
- `selection? / onSelectionChange?`
- `isEditing? / onIsEditingChange?`
- `onEvent?: GridEventHandler<T>`

### GridApi (Plugins)

- State: `numRows`, `numCols`, `activeCell`, `selection`, `isEditing`
- Commands: `setActiveCell`, `setSelection`, `beginEdit`, `cancelEdit`, `commitEdit`
- Data: `updateCells(patches)`

## 6. Plugins

Plugins are small functions that add behavior by reacting to grid events. The
core `Gridsheet` stays minimal, and features like selection, editing, delete,
and clipboard are composed by plugins via `createPluginHost`.

### Using Plugins

```ts
const plugins = createPluginHost([
  selectionPlugin(),
  editingPlugin(),
]);

<Gridsheet onEvent={plugins.onEvent} ... />
```

### selectionPlugin

- Cell/row/column selection
- Drag selection
- Arrow + Shift range expansion
- Tab navigation (with wrapping)

### editingPlugin

- Start edit on double click
- Start edit on keys (default: Enter)

```ts
editingPlugin({ triggerKeys: ["Enter", "F2"] });
```

### deletePlugin

Clears selected cells.

```ts
deletePlugin({ emptyValue: "" });
```

### clipboardMemoryPlugin

In-memory clipboard (no system clipboard).

```ts
clipboardMemoryPlugin({
  getData: () => data(),
  emptyValue: "",
});
```

### clipboardTextPlugin

System clipboard integration. Defaults to TSV.

```ts
clipboardTextPlugin({
  getData: () => data(),
  emptyValue: "",
  // optional overrides:
  // toText: (rows) => rows.map(r => r.join("\t")).join("\n"),
  // fromText: (text, target) => patches,
});
```

## 7. Recipes

See `docs/recipes.md` for examples and patterns.

## 8. Styling

See `docs/styling.md` for styling patterns and class hooks.

## 9. Presets (Optional)

Small helpers are available from the presets entry point for quick setup.

```tsx
import { gridsheetStyle, textCellRenderer } from "@shiguri/solid-grid/presets";

<Gridsheet
  class={gridsheetStyle}
  renderCell={textCellRenderer}
  // other props still required, same as usual (data, onCellsChange, plugins, etc.)
/>;
```

- `textCellRenderer`: a basic text input cell editor (Enter to commit, Escape to cancel).
- `gridsheetStyle`: a minimal Tailwind-style class string that targets the built-in
  `data-slot` hooks and preset input slot.

These are independent helpers: you can use either one without the other.

## 10. FAQ

**Q: Why doesn’t the grid update on edit?**  
**A:** Provide `onCellsChange` and apply patches to your data.

**Q: Paste from Excel doesn’t work.**  
**A:** Use `clipboardTextPlugin` which reads TSV from system clipboard.

**Q: Input loses focus while typing.**  
**A:** Avoid updating the backing data on every keypress. Commit on Enter.
