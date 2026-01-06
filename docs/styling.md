# Styling

Solid Grid is intentionally unopinionated about styles. You can style it by
targeting `data-slot` attributes or by passing `classes` to `Gridsheet`.

## Data-slot attributes

Every core element exposes a `data-slot` attribute:

- `gridsheet`
- `gridsheet-header`
- `gridsheet-body`
- `gridsheet-row`
- `gridsheet-corner`
- `gridsheet-rowheader`
- `gridsheet-colheader`
- `gridsheet-cell`

Example:

```css
[data-slot="gridsheet"] {
  border-collapse: collapse;
  width: 100%;
}

[data-slot="gridsheet-cell"] {
  border: 1px solid #e5e5e5;
  padding: 6px 8px;
}

[data-slot="gridsheet-cell"][data-selected] {
  background: #eaf2ff;
}

[data-slot="gridsheet-cell"][data-active] {
  outline: 2px solid #2f6fed;
}
```

## classes prop

You can pass class names (or class name builders) via the `classes` prop:

```tsx
<Gridsheet
  classes={{
    cell: ({ isSelected, isActive }) =>
      [
        "cell",
        isSelected && "cell--selected",
        isActive && "cell--active",
      ]
        .filter(Boolean)
        .join(" "),
    rowHeader: ({ isSelected }) =>
      isSelected ? "row-header row-header--selected" : "row-header",
    colHeader: ({ isSelected }) =>
      isSelected ? "col-header col-header--selected" : "col-header",
    corner: "corner",
    header: "header",
    body: "body",
  }}
/>
```

Available class slots:

- `cell`
- `row`
- `rowHeader`
- `colHeader`
- `corner`
- `header`
- `body`

## Custom header content

Use `renderRowHeader` and `renderColHeader` to render custom header content
while keeping selection styling hooks. Headers set `data-selected` when the row
or column is part of the selection range, so you can target them directly in
CSS.

```tsx
<Gridsheet
  data={data()}
  renderCell={(ctx) => <span>{ctx.value}</span>}
  renderRowHeader={({ index, isSelected }) => (
    <span class={isSelected ? "row-header--selected" : undefined}>
      #{index + 1}
    </span>
  )}
  renderColHeader={({ index }) => <span>Field {index + 1}</span>}
/>
```

```css
[data-slot="gridsheet-rowheader"][data-selected],
[data-slot="gridsheet-colheader"][data-selected] {
  background: #eaf2ff;
  font-weight: 600;
}
```

## State data attributes

Cells and headers set `data-selected`, `data-active`, and `data-editing`
attributes when applicable. Use these to style state without JS.

```css
[data-slot="gridsheet-cell"][data-editing] {
  background: #fff7e6;
}
```
