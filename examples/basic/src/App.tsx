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

// Minimal helper to apply grid patches to a 2D array.
// In real apps, replace this with your preferred state management.
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

function CellRenderer(ctx: CellRenderContext<string>) {
  const [draft, setDraft] = createSignal(ctx.value);
  createEffect(() => {
    if (!ctx.isEditing) {
      setDraft(ctx.value);
    }
  });

  let inputRef: HTMLInputElement | undefined;
  createEffect(() => {
    if (!inputRef) return;
    if (ctx.isEditing) {
      inputRef.select();
      inputRef.focus();
    }
  });

  const handleCommit = () => {
    ctx.commitEdit(draft());

    // Refocus the cell after commit, once any re-render settles.
    queueMicrotask(() => ctx.cellRef?.focus());
  };

  const handleCancel = () => {
    setDraft(ctx.value);
    ctx.cancelEditing();
    queueMicrotask(() => ctx.cellRef?.focus());
  };

  if (ctx.isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={draft()}
        onInput={(e) => setDraft(e.currentTarget.value)}
        onKeyDown={(e) => {
          if (e.isComposing) return;
          if (e.key === "Enter") {
            e.preventDefault();
            e.stopPropagation();
            handleCommit();
          } else if (e.key === "Escape") {
            e.preventDefault();
            e.stopPropagation();
            handleCancel();
          }
        }}
        onBlur={handleCommit}
        size={1}
      />
    );
  }
  return (
    // Let the cell element handle dblclick/selection; avoid child span swallowing events.
    <span style={{ "pointer-events": "none" }}>{ctx.value}</span>
  );
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
    <>
      <h1>Solid Grid - Basic Example</h1>
      <Gridsheet
        data={data()}
        onCellsChange={(patches) =>
          setData((prev) => applyPatches(prev, patches))
        }
        renderCell={CellRenderer}
        onEvent={plugins.onEvent}
      />
    </>
  );
}

export default App;
