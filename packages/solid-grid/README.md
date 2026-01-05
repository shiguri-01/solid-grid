# solid-grid

Headless, plugin-driven grid for SolidJS. Designed for **T[][]** data and
controlled rendering/styling.

> **Work in progress**: The API is still evolving and may include breaking changes.

## Install

```bash
npm install @shiguri/solid-grid
```

## Quick Start

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

## Docs

See full docs in the root repository `docs/`:

- `docs/guide.md`
- `docs/recipes.md`
- `docs/styling.md`
