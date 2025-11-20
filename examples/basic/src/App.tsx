import type { CellRenderContext } from "solid-grid";
import { Gridsheet } from "solid-grid";
import { createEffect, createSignal } from "solid-js";
import "./App.css";

function App() {
  const [data, setData] = createSignal([
    ["A1", "B1", "C1", "D1"],
    ["A2", "B2", "C2", "D2"],
    ["A3", "B3", "C3", "D3"],
    ["A4", "B4", "C4", "D4"],
  ]);

  return (
    <div>
      <h1>Solid Grid - Basic Example</h1>
      <Gridsheet
        data={data()}
        onDataChange={setData}
        renderCell={CellRenderer}
      />
    </div>
  );
}

function CellRenderer(ctx: CellRenderContext<string>) {
  let inputRef: HTMLInputElement | undefined;
  createEffect(() => {
    if (!inputRef) return;
    if (ctx.isEditing) {
      inputRef.select();
      inputRef.focus();
    }
  });

  if (ctx.isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={ctx.value}
        // onInput={(e) => ctx.setValue(e.currentTarget.value)}
        // onBlur={() => ctx.cancelEditing()}
        onKeyDown={(e) => {
          if (e.isComposing) return;
          if (e.key === "Enter" || e.key === "Escape") {
            e.preventDefault();
            e.stopPropagation();
            ctx.commitEdit(inputRef?.value ?? ctx.value);
            ctx.cancelEditing();
            ctx.cellRef?.focus();
          }
        }}
        style={{ width: "100%", "box-sizing": "border-box" }}
      />
    );
  }
  return <span>{ctx.value}</span>;
}

export default App;
