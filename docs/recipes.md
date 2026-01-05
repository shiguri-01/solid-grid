# Recipes

## Large data updates

Use `onCellsChange` with a targeted update strategy:

```ts
onCellsChange={(patches) =>
  setData((prev) =>
    prev.map((row, r) =>
      row.map((value, c) => {
        const p = patches.find((x) => x.pos.row === r && x.pos.col === c);
        return p ? p.value : value;
      }),
    ),
  )
}
```

## createStore integration

```ts
onCellsChange={(patches) => {
  for (const { pos, value } of patches) {
    setStore(pos.row, pos.col, value);
  }
}}
```

## Custom editing UI

Use `CellRenderContext` to control focus and commit/cancel.

## Non-string cells (numbers)

```tsx
import { createSignal } from "solid-js";
import { Gridsheet, CellRenderContext } from "@shiguri/solid-grid";

function App() {
  const [data, setData] = createSignal<number[][]>([
    [10, 20],
    [30, 40],
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
    />
  );
}
```

## Non-string cells (objects)

```tsx
type CellValue = { value: number; unit: "px" | "em" };

function App() {
  const [data, setData] = createSignal<CellValue[][]>([
    [
      { value: 10, unit: "px" },
      { value: 2, unit: "em" },
    ],
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
      renderCell={(ctx) => (
        <span>
          {ctx.value.value}
          {ctx.value.unit}
        </span>
      )}
    />
  );
}
```

## Validation in the cell renderer

```tsx
function CellRenderer(ctx: CellRenderContext<number>) {
  let inputRef: HTMLInputElement | undefined;

  if (!ctx.isEditing) {
    return <span>{ctx.value}</span>;
  }

  const commitIfValid = () => {
    const raw = inputRef?.value ?? "";
    const next = Number(raw);
    if (!Number.isFinite(next)) {
      // stay in edit mode, show error (simple example)
      return;
    }
    ctx.commitEdit(next);
    ctx.cancelEditing();
  };

  return (
    <input
      ref={inputRef}
      type="text"
      value={String(ctx.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          commitIfValid();
          ctx.cellRef?.focus();
        } else if (e.key === "Escape") {
          e.preventDefault();
          ctx.cancelEditing();
          ctx.cellRef?.focus();
        }
      }}
    />
  );
}
```

## TSV paste with type conversion

```tsx
import { clipboardTextPlugin } from "@shiguri/solid-grid";

clipboardTextPlugin<number>({
  getData: () => data(),
  emptyValue: 0,
  fromText: (text, target) => {
    const rows = text.trim().split("\n").map((line) => line.split("\t"));
    return rows.flatMap((row, r) =>
      row.map((raw, c) => ({
        pos: { row: target.row + r, col: target.col + c },
        value: Number(raw),
      })),
    );
  },
});
```
