import {
	clipboardTextPlugin,
	createPluginHost,
	deletePlugin,
	editingPlugin,
	Gridsheet,
	selectionPlugin,
} from "@shiguri/solid-grid";
import { createSignal } from "solid-js";
import "./CssStyledGrid.css";

const makeData = (rows: number, cols: number) =>
	Array.from({ length: rows }, (_, r) =>
		Array.from({ length: cols }, (_, c) => `R${r + 1}C${c + 1}`),
	);

export default function CssStyledGrid() {
	const [data, setData] = createSignal(makeData(5, 5));
	const plugins = createPluginHost<string>([
		selectionPlugin(),
		editingPlugin(),
		deletePlugin({ emptyValue: "" }),
		clipboardTextPlugin({ getData: () => data(), emptyValue: "" }),
	]);

	return (
		<Gridsheet
			data={data()}
			class="css-grid-example"
			renderCell={(ctx) => ctx.value}
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
