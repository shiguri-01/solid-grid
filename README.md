# solid-grid

A headless grid component for [SolidJS](https://docs.solidjs.com/).
Designed for `T[][]` data with custom rendering.

> [!WARNING]
> **Work in progress**: The API is still evolving and may include breaking changes.

## Installation

```bash
npm install @shiguri/solid-grid
```

## Usage

```tsx
import {
  Gridsheet,
  clipboardTextPlugin,
  createPluginHost,
  deletePlugin,
  selectionPlugin,
  editingPlugin,
} from "@shiguri/solid-grid";
import { textCellRenderer } from "@shiguri/solid-grid/presets";
import { createSignal } from "solid-js";

function App() {
  const [data, setData] = createSignal([
    ["A1", "B1"],
    ["A2", "B2"],
  ]);

  const plugins = createPluginHost<string>([
    selectionPlugin(),
    editingPlugin(),
    deletePlugin({ emptyValue: "" }),
    clipboardTextPlugin({ getData: () => data(), emptyValue: "" }),
  ]);

  return (
    <Gridsheet
      data={data()}
      renderCell={textCellRenderer}
      onCellsChange={(patches) =>
        setData((prev) => {
          const next = prev.map((row) => row.slice());
          for (const { pos, value } of patches) {
            next[pos.row][pos.col] = value;
          }
          return next;
        })
      }
      onEvent={plugins.onEvent}
    />
  );
}
```

## Documentation

See the [docs/](./docs/) directory.

---

© 2025 shiguri | [MIT License](./LICENSE)
