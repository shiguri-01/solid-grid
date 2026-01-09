import {
	clipboardTextPlugin,
	createPluginHost,
	deletePlugin,
	editingPlugin,
	Gridsheet,
	selectionPlugin,
} from "@shiguri/solid-grid";
import { gridsheetStyle, textCellRenderer } from "@shiguri/solid-grid/presets";
import { createSignal } from "solid-js";

const makeData = (rows: number, cols: number) =>
	Array.from({ length: rows }, (_, r) =>
		Array.from({ length: cols }, (_, c) => `R${r + 1}C${c + 1}`),
	);

export default function BasicGrid() {
	const [data, setData] = createSignal(makeData(6, 6));
	const plugins = createPluginHost<string>([
		selectionPlugin(),
		editingPlugin({ triggerKeys: ["Enter", "F2"] }),
		deletePlugin({ emptyValue: "" }),
		clipboardTextPlugin({ getData: () => data(), emptyValue: "" }),
	]);

	return (
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
	);
}
