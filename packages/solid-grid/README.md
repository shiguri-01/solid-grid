# solid-grid

Headless spreadsheet-like grid for SolidJS. Works with a 2D array (`T[][]`) and gives you full control over rendering and styling.

## Install

```bash
npm install @shiguri/solid-grid
```

## Quick Start

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

## More Info

See full docs in the root repository `docs/`.
