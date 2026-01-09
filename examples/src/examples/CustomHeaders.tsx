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

const dataSeed = [
	["R1C1", "R1C2", "R1C3"],
	["R2C1", "R2C2", "R2C3"],
	["R3C1", "R3C2", "R3C3"],
	["R4C1", "R4C2", "R4C3"],
];

export default function CustomHeaders() {
	const [data, setData] = createSignal(dataSeed);
	const plugins = createPluginHost<string>([
		selectionPlugin(),
		editingPlugin(),
		deletePlugin({ emptyValue: "" }),
		clipboardTextPlugin({ getData: () => data(), emptyValue: "" }),
	]);

	return (
		<Gridsheet
			data={data()}
			class={gridsheetStyle}
			renderCell={textCellRenderer}
			renderRowHeader={({ index }) => <span>Row {index + 1}</span>}
			renderColHeader={({ index }) => (
				<span>
					{["Field A", "Field B", "Field C"][index] ?? `Col ${index + 1}`}
				</span>
			)}
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
