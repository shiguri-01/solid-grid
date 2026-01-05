# solid-grid

A headless, plugin-driven grid component for [SolidJS](https://www.solidjs.com/).
Designed for **T[][]** data and custom rendering.

> **Work in progress**: The API is still evolving and may include breaking changes.

## Installation

```bash
npm install @shiguri/solid-grid
```

## Usage

```tsx
import { createSignal } from "solid-js";
import {
  Gridsheet,
  createPluginHost,
  selectionPlugin,
  editingPlugin,
} from "@shiguri/solid-grid";

const [data, setData] = createSignal([
  ["A1", "B1"],
  ["A2", "B2"],
]);

const plugins = createPluginHost([
  selectionPlugin(),
  editingPlugin({ triggerKeys: ["Enter"] }),
]);

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
/>;
```

## Documentation

- `docs/guide.md`
- `docs/recipes.md`
- `docs/styling.md`

---

@ 2025 shiguri | [MIT License](./LICENSE)
