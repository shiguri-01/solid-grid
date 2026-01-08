import { createEffect, createSignal } from "solid-js";
import type { CellRenderContext } from "./gridsheet";

export function textCellRenderer(ctx: CellRenderContext<string>) {
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
        data-slot="gridsheet-preset-text-input"
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
      />
    );
  }

  return <>{ctx.value}</>;
}

export const gridsheetStyle =
  "sg-spreadsheet border-collapse " +
  "[--sg-border:1px_solid_#d1d5db] " +
  "[--sg-bg:#ffffff] " +
  "[--sg-header-bg:#f1f5f9] " +
  "[--sg-header-selected-bg:#bfdbfe] " +
  "[--sg-selected-bg:#dbeafe] " +
  "[--sg-active:#2563eb] " +
  "[--sg-cell-padding-x:0.75rem] " +
  "[--sg-cell-padding-y:0.5rem] " +
  "[--sg-cell-min-w:80px] " +
  "[border:var(--sg-border)] " +
  "[&_[data-slot=gridsheet-rowheader]]:[border:var(--sg-border)] " +
  "[&_[data-slot=gridsheet-colheader]]:[border:var(--sg-border)] " +
  "[&_[data-slot=gridsheet-corner]]:[border:var(--sg-border)] " +
  "[&_[data-slot=gridsheet-cell]]:[border:var(--sg-border)] " +
  "[&_[data-slot=gridsheet-rowheader]]:bg-(--sg-header-bg) " +
  "[&_[data-slot=gridsheet-colheader]]:bg-(--sg-header-bg) " +
  "[&_[data-slot=gridsheet-corner]]:bg-(--sg-header-bg) " +
  "[&_[data-slot=gridsheet-rowheader]]:font-semibold " +
  "[&_[data-slot=gridsheet-colheader]]:font-semibold " +
  "[&_[data-slot=gridsheet-rowheader]]:text-slate-700 " +
  "[&_[data-slot=gridsheet-colheader]]:text-slate-700 " +
  "[&_[data-slot=gridsheet-rowheader][data-selected]]:bg-(--sg-header-selected-bg) " +
  "[&_[data-slot=gridsheet-colheader][data-selected]]:bg-(--sg-header-selected-bg) " +
  "[&_[data-slot=gridsheet-cell]]:bg-(--sg-bg) " +
  "[&_[data-slot=gridsheet-cell]]:px-(--sg-cell-padding-x) " +
  "[&_[data-slot=gridsheet-cell]]:py-(--sg-cell-padding-y) " +
  "[&_[data-slot=gridsheet-cell]]:min-w-(--sg-cell-min-w) " +
  "[&_[data-slot=gridsheet-cell][data-selected]]:bg-(--sg-selected-bg) " +
  "[&_[data-slot=gridsheet-cell][data-active]]:outline " +
  "[&_[data-slot=gridsheet-cell][data-active]]:outline-2 " +
  "[&_[data-slot=gridsheet-cell][data-active]]:outline-(--sg-active) " +
  "[&_[data-slot=gridsheet-cell][data-active]]:-outline-offset-2 " +
  "[&_[data-slot=gridsheet-cell][data-editing]]:bg-(--sg-bg) " +
  "[&_[data-slot=gridsheet-preset-text-input]]:w-full " +
  "[&_[data-slot=gridsheet-preset-text-input]]:h-full " +
  "[&_[data-slot=gridsheet-preset-text-input]]:min-w-0 " +
  "[&_[data-slot=gridsheet-preset-text-input]]:bg-transparent " +
  "[&_[data-slot=gridsheet-preset-text-input]]:outline-none " +
  "[&_[data-slot=gridsheet-preset-text-input]]:border-0 " +
  "[&_[data-slot=gridsheet-preset-text-input]]:p-0 " +
  "[&_[data-slot=gridsheet-preset-text-input]]:m-0 " +
  "[&_[data-slot=gridsheet-preset-text-input]]:text-inherit " +
  "[&_[data-slot=gridsheet-preset-text-input]]:font-inherit";
