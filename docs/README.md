# Solid Grid Documentation

**@shiguri/solid-grid** is a headless, customizable spreadsheet-like grid component for [SolidJS](https://www.solidjs.com/).

## Features

- **Headless design** - Full control over cell rendering and styling
- **Generic `T[][]` data** - Works with any cell type (strings, numbers, objects, etc.)
- **Keyboard navigation** - Arrow keys, Tab, Enter support
- **Mouse selection** - Click, drag, and multi-select support
- **Inline editing** - Built-in editing mode with customizable editors
- **Copy/Paste/Cut** - Clipboard operations with customizable handlers (Ctrl+C/X/V)
- **Row/Column selection** - Click headers to select entire rows or columns
- **Controlled & Uncontrolled** - Support for both state management patterns
- **Lightweight** - Zero dependencies (except SolidJS peer dependency)

## Quick Example

```tsx
import { Gridsheet } from "@shiguri/solid-grid";
import { createSignal } from "solid-js";

function App() {
  const [data, setData] = createSignal([
    ["A1", "B1", "C1"],
    ["A2", "B2", "C2"],
    ["A3", "B3", "C3"],
  ]);

  return (
    <Gridsheet
      data={data()}
      onDataChange={setData}
      renderCell={(ctx) =>
        ctx.isEditing ? (
          <input
            value={ctx.value}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                ctx.commitEdit(e.currentTarget.value);
              }
            }}
          />
        ) : (
          <span>{ctx.value}</span>
        )
      }
    />
  );
}
```

## Data Structure

The grid works with a **2D array (`T[][]`)** where each cell can be any type:

```tsx
// e.g. number grid
const numbers: number[][] = [
  [100, 200],
  [300, 400],
];
```

## Use Cases

Because the component is **headless**, you have full control over cell rendering:

- **Spreadsheet** - Excel-like interfaces with editing
- **Data Entry** - Structured input forms
- **Schedules** - Weekly timetables, booking grids
- **Game Boards** - Chess, Sudoku, puzzles

## Documentation

- [Installation](./installation.md)
- [Quick Start](./quick-start.md)
- [API Reference](./api-reference.md)
- [Examples](./examples.md)
- [Styling Guide](./styling.md)

## License

MIT
