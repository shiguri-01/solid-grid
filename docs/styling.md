# Styling Guide

`@shiguri/solid-grid` is headless - it has no default styles. You have complete control over appearance.

## Styling Options

There are two ways to style the grid:

1. **CSS with data attributes** - Use `[data-slot="..."]` and `[data-selected]` selectors
2. **`classes` prop** - Pass static or dynamic class names

## Data Attributes

### Structure Attributes

| Element       | Selector                            |
| ------------- | ----------------------------------- |
| Table         | `[data-slot="gridsheet"]`           |
| Cell          | `[data-slot="gridsheet-cell"]`      |
| Row Header    | `[data-slot="gridsheet-rowheader"]` |
| Column Header | `[data-slot="gridsheet-colheader"]` |
| Corner        | `[data-slot="gridsheet-corner"]`    |

### State Attributes

Applied to cells and headers based on their state:

| Attribute       | Applied to     | When                     |
| --------------- | -------------- | ------------------------ |
| `data-selected` | cells, headers | Cell/row/col is selected |
| `data-active`   | cells          | Cell is focused          |
| `data-editing`  | cells          | Cell is being edited     |

## `class` and `classes` Props

| Prop      | Type             | Description               |
| --------- | ---------------- | ------------------------- |
| `class`   | `string`         | Class for the table       |
| `classes` | `GridClasses<T>` | Classes for various parts |

### `classes` Object

All properties accept a `string`. Some also accept a function for dynamic styling:

| Property    | Type                                                    |
| ----------- | ------------------------------------------------------- |
| `cell`      | `string` or `(ctx: CellRenderContext<T>) => string`     |
| `row`       | `string` or `(ctx: { rowIndex: number }) => string`     |
| `rowHeader` | `string` or `(ctx: { rowIndex, isSelected }) => string` |
| `colHeader` | `string` or `(ctx: { colIndex, isSelected }) => string` |
| `corner`    | `string`                                                |
| `header`    | `string`                                                |
| `body`      | `string`                                                |

```tsx
<Gridsheet
  classes={{
    cell: "my-cell", // static
    // cell: (ctx) => ctx.isSelected ? "selected" : "",     // or dynamic
    row: ({ rowIndex }) => (rowIndex % 2 ? "odd" : ""),
    rowHeader: ({ isSelected }) => (isSelected ? "selected" : ""),
    colHeader: ({ isSelected }) => (isSelected ? "selected" : ""),
    corner: "corner",
  }}
/>
```

---

## Tips

1. Use `border-collapse: collapse` on the table
2. Set `min-width` on cells to prevent shrinking
3. Use `box-sizing: border-box` on inputs
4. Remove padding on editing cells for full input coverage
5. Use `user-select: none` on headers
6. Define CSS variables on `[data-slot="gridsheet"]` for easy theming

---

## Example Styles

For a complete, copy-paste ready stylesheet, see the [basic example](../examples/basic/src/App.css).

### Minimal CSS

```css
[data-slot="gridsheet"] {
  border-collapse: collapse;
}

[data-slot="gridsheet"] th,
[data-slot="gridsheet"] td {
  border: 1px solid #ddd;
  padding: 8px;
  min-width: 80px;
}

[data-slot="gridsheet"] th {
  background-color: #f5f5f5;
}

[data-slot="gridsheet-cell"][data-selected] {
  background-color: #e3f2fd;
}

[data-slot="gridsheet-cell"][data-active] {
  outline: 2px solid #1976d2;
  outline-offset: -2px;
}

[data-slot="gridsheet-cell"][data-editing] {
  padding: 0;
}

[data-slot="gridsheet-cell"][data-editing] input {
  width: 100%;
  padding: 8px;
  border: none;
  outline: none;
  box-sizing: border-box;
}
```
