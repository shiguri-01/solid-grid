import type { CellRenderContext } from "@shiguri/solid-grid";
import {
	clipboardTextPlugin,
	createPluginHost,
	deletePlugin,
	editingPlugin,
	Gridsheet,
	selectionPlugin,
} from "@shiguri/solid-grid";
import { gridsheetStyle } from "@shiguri/solid-grid/presets";
import { createEffect, createSignal } from "solid-js";

function NumberCell(ctx: CellRenderContext<number>) {
	const [draft, setDraft] = createSignal(String(ctx.value));
	const [error, setError] = createSignal<string | null>(null);
	let inputRef: HTMLInputElement | undefined;

	createEffect(() => {
		if (!ctx.isEditing) {
			setDraft(String(ctx.value));
			setError(null);
		}
	});

	createEffect(() => {
		if (!ctx.isEditing || !inputRef) return;
		inputRef.focus();
		inputRef.select();
	});

	const commitIfValid = () => {
		const next = Number(draft());
		if (!Number.isFinite(next)) {
			setError("Enter a number");
			return;
		}
		ctx.commitEdit(next);
		queueMicrotask(() => ctx.cellRef?.focus());
	};

	const cancel = () => {
		setDraft(String(ctx.value));
		setError(null);
		ctx.cancelEditing();
		queueMicrotask(() => ctx.cellRef?.focus());
	};

	if (ctx.isEditing) {
		return (
			<div class="flex flex-col gap-1">
				<input
					ref={inputRef}
					type="text"
					value={draft()}
					onInput={(e) => {
						setDraft(e.currentTarget.value);
						setError(null);
					}}
					onKeyDown={(e) => {
						if (e.isComposing) return;
						if (e.key === "Enter") {
							e.preventDefault();
							commitIfValid();
						} else if (e.key === "Escape") {
							e.preventDefault();
							cancel();
						}
					}}
					onBlur={commitIfValid}
					class="w-full rounded border border-slate-300 bg-white px-2 py-1 text-sm outline-none focus:border-sky-400"
				/>
				{error() && <span class="text-rose-500 text-xs">{error()}</span>}
			</div>
		);
	}

	return <span>{ctx.value}</span>;
}

const seeded = [
	[1200, 980, 1150, 1320],
	[640, 720, 680, 710],
	[410, 500, 450, 530],
];

export default function NumericValidation() {
	const [data, setData] = createSignal(seeded);
	const plugins = createPluginHost<number>([
		selectionPlugin(),
		editingPlugin({ triggerKeys: ["Enter", "F2"] }),
		deletePlugin({ emptyValue: 0 }),
		clipboardTextPlugin({ getData: () => data(), emptyValue: 0 }),
	]);

	return (
		<Gridsheet
			data={data()}
			class={gridsheetStyle}
			renderCell={NumberCell}
			onCellsChange={(patches) =>
				setData((prev) => {
					const next = prev.map((row) => row.slice());
					for (const { pos, value } of patches) {
						next[pos.row][pos.col] = value;
					}
					return next;
				})
			}
			onEvent={plugins.onEvent}
		/>
	);
}
