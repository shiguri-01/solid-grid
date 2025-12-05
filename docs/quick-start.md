# Quick Start

This guide will help you get started with `@shiguri/solid-grid`.

## Basic Setup

### 1. Import the Component

```tsx
import { Gridsheet } from "@shiguri/solid-grid";
import type { CellRenderContext } from "@shiguri/solid-grid";
```

### 2. Create Your Data

The grid works with a **2D array (`T[][]`)**. Each inner array is a row:

```tsx
import { createSignal } from "solid-js";

const [data, setData] = createSignal([
  ["Name", "Age", "City"],
  ["Alice", "30", "New York"],
  ["Bob", "25", "Los Angeles"],
]);
```

### 3. Define a Cell Renderer

The `renderCell` prop gives you full control over how each cell is displayed:

```tsx
function CellRenderer(ctx: CellRenderContext<string>) {
  if (ctx.isEditing) {
    return (
      <input
        type="text"
        value={ctx.value}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            ctx.commitEdit(e.currentTarget.value);
          } else if (e.key === "Escape") {
            ctx.cancelEditing();
          }
        }}
      />
    );
  }
  return <span>{ctx.value}</span>;
}
```

### 4. Render the Grid

```tsx
function App() {
  const [data, setData] = createSignal([
    ["Name", "Age", "City"],
    ["Alice", "30", "New York"],
  ]);

  return (
    <Gridsheet data={data()} onDataChange={setData} renderCell={CellRenderer} />
  );
}
```

## Keyboard Navigation

| Key                        | Action                |
| -------------------------- | --------------------- |
| `Arrow Up/Down/Left/Right` | Move active cell      |
| `Shift + Arrow Keys`       | Extend selection      |
| `Tab` / `Shift + Tab`      | Move to next/previous |
| `Enter`                    | Enter edit mode       |

## Mouse Interactions

| Action              | Result               |
| ------------------- | -------------------- |
| Click cell          | Select cell          |
| Click and drag      | Select range         |
| Double-click cell   | Enter edit mode      |
| Click row header    | Select entire row    |
| Click column header | Select entire column |
| Click corner        | Select all cells     |

## Next Steps

- [API Reference](./api-reference.md) - All available props
- [Examples](./examples.md) - More use cases
- [Styling Guide](./styling.md) - Customize appearance
