import type { CellRange } from "@shiguri/solid-grid";
import {
	clipboardMemoryPlugin,
	createPluginHost,
	deletePlugin,
	editingPlugin,
	Gridsheet,
	selectionPlugin,
} from "@shiguri/solid-grid";
import { gridsheetStyle, textCellRenderer } from "@shiguri/solid-grid/presets";
import { createSignal } from "solid-js";

const starter = [
	["Alpha", "Bravo", "Charlie", "Delta"],
	["Echo", "Foxtrot", "Golf", "Hotel"],
	["India", "Juliet", "Kilo", "Lima"],
	["Mike", "November", "Oscar", "Papa"],
];

export default function ClipboardMemory() {
	const [data, setData] = createSignal(starter);

	const [clipboard, setClipboard] = createSignal<{
		data: string[][];
		range: CellRange;
	} | null>(null);
	const clipboardLabel = () => {
		const data = clipboard();
		if (!data) return "Copied: none";
		const rows = data.range.max.row - data.range.min.row + 1;
		const cols = data.range.max.col - data.range.min.col + 1;
		return `Copied: ${rows}x${cols} cells`;
	};

	const plugins = createPluginHost<string>([
		selectionPlugin(),
		editingPlugin(),
		deletePlugin({ emptyValue: "" }),
		clipboardMemoryPlugin({
			getData: () => data(),
			emptyValue: "",
			onClipboardChange: (next) => setClipboard(next),
		}),
	]);

	return (
		<>
			<div class="mb-2 font-medium text-neutral-600">{clipboardLabel()}</div>
			<Gridsheet
				data={data()}
				class={gridsheetStyle}
				renderCell={textCellRenderer}
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
		</>
	);
}
