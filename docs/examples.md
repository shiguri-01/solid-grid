# Examples

## Basic Text Grid

A simple editable grid with `string[][]`:

You need to create your own cell components using the `renderCell` prop.

> [!NOTE]
> If your data is an array of row objects (e.g., `{ name: string, email: string }[]`), consider using a data table library like [TanStack Table](https://tanstack.com/table/latest) instead. This library is designed for 2D matrix data (`T[][]`), not object arrays.

```tsx
import { Gridsheet } from "@shiguri/solid-grid";
import type { CellRenderContext } from "@shiguri/solid-grid";
import { createSignal, createEffect } from "solid-js";

function BasicGrid() {
  const [data, setData] = createSignal([
    ["Name", "Email", "Role"],
    ["Alice", "alice@example.com", "Admin"],
    ["Bob", "bob@example.com", "User"],
  ]);

  return (
    <Gridsheet
      data={data()}
      onDataChange={setData}
      renderCell={(ctx) => <TextCell {...ctx} />}
    />
  );
}

function TextCell(ctx: CellRenderContext<string>) {
  let inputRef: HTMLInputElement | undefined;

  createEffect(() => {
    if (ctx.isEditing && inputRef) {
      inputRef.focus();
      inputRef.select();
    }
  });

  if (ctx.isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={ctx.value}
        onKeyDown={(e) => {
          if (e.isComposing) return; // IME support
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

---

## Numeric Grid

A grid with `number[][]` and currency formatting:

```tsx
import { Gridsheet } from "@shiguri/solid-grid";
import type { CellRenderContext } from "@shiguri/solid-grid";
import { createSignal, createEffect } from "solid-js";

function NumericGrid() {
  const [data, setData] = createSignal([
    [1000, 2500, 3750],
    [4200, 5100, 6800],
  ]);

  return (
    <Gridsheet
      data={data()}
      onDataChange={setData}
      renderCell={(ctx) => <NumericCell {...ctx} />}
    />
  );
}

function NumericCell(ctx: CellRenderContext<number>) {
  let inputRef: HTMLInputElement | undefined;

  createEffect(() => {
    if (ctx.isEditing && inputRef) {
      inputRef.focus();
      inputRef.select();
    }
  });

  if (ctx.isEditing) {
    return (
      <input
        ref={inputRef}
        type="number"
        value={ctx.value}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            const value = parseFloat(e.currentTarget.value);
            if (!isNaN(value)) ctx.commitEdit(value);
          } else if (e.key === "Escape") {
            ctx.cancelEditing();
          }
        }}
      />
    );
  }

  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(ctx.value);

  return <span>{formatted}</span>;
}
```

---

## Read-Only Grid

Display data without editing:

```tsx
import { Gridsheet } from "@shiguri/solid-grid";

function ReadOnlyGrid() {
  const data = [
    ["January", "1,234", "5,678"],
    ["February", "2,345", "6,789"],
  ];

  return (
    <Gridsheet
      data={data}
      renderCell={(ctx) => <span>{ctx.value}</span>}
      // No onDataChange = read-only
    />
  );
}
```

---

## Custom Styling

Apply styles using the `classes` prop:

```tsx
import { Gridsheet } from "@shiguri/solid-grid";
import { createSignal } from "solid-js";
import "./grid.css";

function StyledGrid() {
  const [data, setData] = createSignal([
    ["A1", "B1", "C1"],
    ["A2", "B2", "C2"],
  ]);

  return (
    <Gridsheet
      data={data()}
      onDataChange={setData}
      class="my-grid"
      classes={{
        cell: (ctx) =>
          `cell ${ctx.isSelected ? "selected" : ""} ${
            ctx.isActive ? "active" : ""
          }`,
        row: ({ rowIndex }) => (rowIndex % 2 === 0 ? "even" : "odd"),
      }}
      renderCell={(ctx) => <span>{ctx.value}</span>}
    />
  );
}
```
