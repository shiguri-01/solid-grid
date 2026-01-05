import type { CellPatch, CellRenderContext } from "@shiguri/solid-grid";
import {
  clipboardTextPlugin,
  createPluginHost,
  deletePlugin,
  editingPlugin,
  Gridsheet,
  selectionPlugin,
} from "@shiguri/solid-grid";
import { createEffect, createSignal } from "solid-js";
import "./App.css";

function applyPatches<T>(data: T[][], patches: CellPatch<T>[]): T[][] {
  const next = data.map((row) => row.slice());
  for (const { pos, value } of patches) {
    const row = next[pos.row];
    if (!row) continue;
    if (pos.col < 0 || pos.col >= row.length) continue;
    row[pos.col] = value;
  }
  return next;
}

function App() {
  const [data, setData] = createSignal([
    ["A1", "B1", "C1", "D1"],
    ["A2", "B2", "C2", "D2"],
    ["A3", "B3", "C3", "D3"],
    ["A4", "B4", "C4", "D4"],
  ]);

  const plugins = createPluginHost<string>([
    selectionPlugin(),
    editingPlugin(),
    clipboardTextPlugin({ getData: () => data(), emptyValue: "" }),
    deletePlugin({ emptyValue: "" }),
  ]);

  return (
    <div>
      <h1>Solid Grid - Basic Example</h1>
      <Gridsheet
        data={data()}
        onCellsChange={(patches) =>
          setData((prev) => applyPatches(prev, patches))
        }
        renderCell={CellRenderer}
        onEvent={plugins.onEvent}
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
        onKeyDown={(e) => {
          if (e.isComposing) return;
          if (e.key === "Enter") {
            e.preventDefault();
            e.stopPropagation();
            ctx.commitEdit(inputRef?.value ?? ctx.value);
            ctx.cellRef?.focus();
          } else if (e.key === "Escape") {
            e.preventDefault();
            e.stopPropagation();
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
