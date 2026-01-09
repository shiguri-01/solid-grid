import {
	clipboardTextPlugin,
	createPluginHost,
	deletePlugin,
	editingPlugin,
	Gridsheet,
	selectionPlugin,
} from "@shiguri/solid-grid";
import { gridsheetStyle, textCellRenderer } from "@shiguri/solid-grid/presets";
import { createStore } from "solid-js/store";

const makeData = (rows: number, cols: number) =>
	Array.from({ length: rows }, (_, r) =>
		Array.from({ length: cols }, (_, c) => `R${r + 1}C${c + 1}`),
	);

type GridStore = { data: string[][] };

export default function CreateStoreGrid() {
	const [store, setStore] = createStore<GridStore>({
		data: makeData(5, 5),
	});

	const plugins = createPluginHost<string>([
		selectionPlugin(),
		editingPlugin(),
		deletePlugin({ emptyValue: "" }),
		clipboardTextPlugin({ getData: () => store.data, emptyValue: "" }),
	]);

	return (
		<Gridsheet
			data={store.data}
			class={gridsheetStyle}
			renderCell={textCellRenderer}
			onCellsChange={(patches) =>
				setStore("data", (prev) => {
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
