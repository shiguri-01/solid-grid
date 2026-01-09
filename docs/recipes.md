# Recipes

## Custom editing UI

In most apps you implement the cell renderer yourself. Use `CellRenderContext`
to control focus and commit/cancel.

```tsx
import { createEffect, createSignal } from "solid-js";
import type { CellRenderContext } from "@shiguri/solid-grid";

function TextCell(ctx: CellRenderContext<string>) {
  const [draft, setDraft] = createSignal(ctx.value);
  let inputRef: HTMLInputElement | undefined;

  createEffect(() => {
    if (!ctx.isEditing) {
      setDraft(ctx.value);
    }
  });

  if (!ctx.isEditing) {
    return <span style={{ "pointer-events": "none" }}>{ctx.value}</span>;
  }

  const commit = () => {
    ctx.commitEdit(draft());
    queueMicrotask(() => ctx.cellRef?.focus());
  };

  const cancel = () => {
    setDraft(ctx.value);
    ctx.cancelEditing();
    queueMicrotask(() => ctx.cellRef?.focus());
  };

  return (
    <input
      ref={inputRef}
      type="text"
      value={draft()}
      onInput={(e) => setDraft(e.currentTarget.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          commit();
        } else if (e.key === "Escape") {
          e.preventDefault();
          cancel();
        }
      }}
      onBlur={commit}
    />
  );
}
```

## Object cells

Store and edit structured values by treating `T` as an object and handling
rendering/commit in your cell renderer.

```ts
onCellsChange={(patches) =>
  setStore("data", (prev) => {
    const next = prev.map((row) => row.slice());
    for (const { pos, value } of patches) {
      next[pos.row][pos.col] = value;
    }
    return next;
  })
}
```

## Validation in the cell renderer

Keep validation close to the edit UI so you can block commits and show errors.

```tsx
import { createEffect, createSignal } from "solid-js";
import type { CellRenderContext } from "@shiguri/solid-grid";
import {
  clipboardTextPlugin,
  createPluginHost,
  deletePlugin,
  editingPlugin,
  Gridsheet,
  selectionPlugin,
} from "@shiguri/solid-grid";

type CellValue = { value: number; unit: "px" | "em" };

function ObjectCell(ctx: CellRenderContext<CellValue>) {
  const [draftValue, setDraftValue] = createSignal(String(ctx.value.value));
  const [draftUnit, setDraftUnit] = createSignal<CellValue["unit"]>(
    ctx.value.unit,
  );

  createEffect(() => {
    if (!ctx.isEditing) {
      setDraftValue(String(ctx.value.value));
      setDraftUnit(ctx.value.unit);
    }
  });

  return (
    ctx.isEditing ? (
      <div class="flex gap-2">
        <input
          type="text"
          value={draftValue()}
          onInput={(e) => setDraftValue(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              const nextValue = Number(draftValue());
              if (!Number.isFinite(nextValue)) return;
              ctx.commitEdit({ value: nextValue, unit: draftUnit() });
              queueMicrotask(() => ctx.cellRef?.focus());
            } else if (e.key === "Escape") {
              e.preventDefault();
              ctx.cancelEditing();
              queueMicrotask(() => ctx.cellRef?.focus());
            }
          }}
        />
        <select
          value={draftUnit()}
          onChange={(e) => setDraftUnit(e.currentTarget.value as CellValue["unit"])}
        >
          <option value="px">px</option>
          <option value="em">em</option>
        </select>
      </div>
    ) : (
      <span style={{ "pointer-events": "none" }}>
        {ctx.value.value}
        {ctx.value.unit}
      </span>
    )
  );
}

function App() {
  const [data, setData] = createSignal<CellValue[][]>([
    [
      { value: 10, unit: "px" },
      { value: 2, unit: "em" },
    ],
  ]);
  const plugins = createPluginHost<CellValue>([
    selectionPlugin(),
    editingPlugin({ triggerKeys: ["Enter", "F2"] }),
    deletePlugin({ emptyValue: { value: 0, unit: "px" } }),
    clipboardTextPlugin({
      getData: () => data(),
      emptyValue: { value: 0, unit: "px" },
    }),
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
      renderCell={ObjectCell}
      onEvent={plugins.onEvent}
    />
  );
}
```

## createStore integration

When using `createStore`, update the nested `data` array immutably.

```ts
onCellsChange={(patches) =>
  setStore("data", (prev) => {
    const next = prev.map((row) => row.slice());
    for (const { pos, value } of patches) {
      next[pos.row][pos.col] = value;
    }
    return next;
  })
}
```

## TSV paste with type conversion

Convert clipboard text into typed cell values when pasting.

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

## Large data updates
Use `onCellsChange` with a targeted update strategy:

```ts
onCellsChange={(patches) =>
  setData((prev) => {
    const next = prev.map((row) => row.slice());
    for (const { pos, value } of patches) {
      next[pos.row][pos.col] = value;
    }
    return next;
  })
}
```

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
