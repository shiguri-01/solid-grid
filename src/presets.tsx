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
  "[--sg-border:var(--color-zinc-300)] " +
  "[--sg-bg:var(--color-white)] " +
  "[--sg-fg:var(--color-zinc-950)] " +
  "[--sg-header-bg:var(--color-zinc-100)] " +
  "[--sg-header-fg:var(--color-zinc-600)] " +
  "[--sg-header-selected-bg:var(--color-blue-100)] " +
  "[--sg-selected-bg:var(--color-blue-50)] " +
  "[--sg-active:var(--color-blue-500)] " +
  "[--sg-cell-padding-x:0.5rem] " +
  "[--sg-cell-padding-y:0.25rem] " +
  "border " +
  "border-(--sg-border) " +
  "bg-(--sg-bg) " +
  "text-(--sg-fg) " +
  "[&_[data-slot=gridsheet-rowheader]]:border " +
  "[&_[data-slot=gridsheet-rowheader]]:border-(--sg-border) " +
  "[&_[data-slot=gridsheet-colheader]]:border " +
  "[&_[data-slot=gridsheet-colheader]]:border-(--sg-border) " +
  "[&_[data-slot=gridsheet-corner]]:border " +
  "[&_[data-slot=gridsheet-corner]]:border-(--sg-border) " +
  "[&_[data-slot=gridsheet-cell]]:border " +
  "[&_[data-slot=gridsheet-cell]]:border-(--sg-border) " +
  "[&_[data-slot=gridsheet-rowheader]]:bg-(--sg-header-bg) " +
  "[&_[data-slot=gridsheet-colheader]]:bg-(--sg-header-bg) " +
  "[&_[data-slot=gridsheet-corner]]:bg-(--sg-header-bg) " +
  "[&_[data-slot=gridsheet-rowheader]]:font-semibold " +
  "[&_[data-slot=gridsheet-colheader]]:font-semibold " +
  "[&_[data-slot=gridsheet-rowheader]]:text-(--sg-header-fg) " +
  "[&_[data-slot=gridsheet-colheader]]:text-(--sg-header-fg) " +
  "[&_[data-slot=gridsheet-rowheader][data-selected]]:bg-(--sg-header-selected-bg) " +
  "[&_[data-slot=gridsheet-colheader][data-selected]]:bg-(--sg-header-selected-bg) " +
  "[&_[data-slot=gridsheet-rowheader]]:px-(--sg-cell-padding-x) " +
  "[&_[data-slot=gridsheet-rowheader]]:py-(--sg-cell-padding-y) " +
  "[&_[data-slot=gridsheet-colheader]]:px-(--sg-cell-padding-x) " +
  "[&_[data-slot=gridsheet-colheader]]:py-(--sg-cell-padding-y) " +
  "[&_[data-slot=gridsheet-cell]]:bg-(--sg-bg) " +
  "[&_[data-slot=gridsheet-cell]]:px-(--sg-cell-padding-x) " +
  "[&_[data-slot=gridsheet-cell]]:py-(--sg-cell-padding-y) " +
  "[&_[data-slot=gridsheet-cell]]:min-w-20 " +
  "[&_[data-slot=gridsheet-cell][data-selected]]:bg-(--sg-selected-bg) " +
  "[&_[data-slot=gridsheet-cell][data-active]]:outline " +
  "[&_[data-slot=gridsheet-cell][data-active]]:outline-2 " +
  "[&_[data-slot=gridsheet-cell][data-active]]:outline-(--sg-active) " +
  "[&_[data-slot=gridsheet-cell][data-active]]:-outline-offset-2 " +
  "[&_[data-slot=gridsheet-cell][data-editing]]:bg-(--sg-bg) " +
  // textCellRenderer preset
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
