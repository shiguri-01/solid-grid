# @shiguri/solid-grid

A headless spreadsheet-like grid component for [SolidJS](https://www.solidjs.com/).

- Generic `T[][]` data structure
- Keyboard navigation & mouse selection

## Installation

```bash
npm install @shiguri/solid-grid
```

## Usage

```tsx
import { Gridsheet } from "@shiguri/solid-grid";
import { createSignal } from "solid-js";

const [data, setData] = createSignal([
  ["A1", "B1"],
  ["A2", "B2"],
]);

<Gridsheet
  data={data()}
  onDataChange={setData}
  renderCell={(ctx) =>
    ctx.isEditing ? (
      <input
        value={ctx.value}
        onKeyDown={(e) =>
          e.key === "Enter" && ctx.commitEdit(e.currentTarget.value)
        }
      />
    ) : (
      <span>{ctx.value}</span>
    )
  }
/>;
```

## Documentation

See [docs/](./docs/README.md) for full documentation.

---

@ 2025 shiguri | [MIT License](./LICENSE)
