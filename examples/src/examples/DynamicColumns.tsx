import type { CellPosition, CellRange } from "@shiguri/solid-grid";
import {
	clipboardTextPlugin,
	createPluginHost,
	deletePlugin,
	editingPlugin,
	Gridsheet,
	normalizeRange,
	selectionPlugin,
} from "@shiguri/solid-grid";
import { gridsheetStyle, textCellRenderer } from "@shiguri/solid-grid/presets";
import { createMemo, createSignal } from "solid-js";
import { Button } from "../Button";

const makeData = (rows: number, cols: number) =>
	Array.from({ length: rows }, (_, r) =>
		Array.from({ length: cols }, (_, c) => `R${r + 1}C${c + 1}`),
	);

const clamp = (n: number, min: number, max: number) =>
	Math.max(min, Math.min(max, n));

const normalizePosition = (
	pos: CellPosition | null,
	rows: number,
	cols: number,
) => {
	if (!pos || rows <= 0 || cols <= 0) return null;
	return {
		row: clamp(pos.row, 0, rows - 1),
		col: clamp(pos.col, 0, cols - 1),
	};
};

const normalizeSelection = (
	range: CellRange | null,
	rows: number,
	cols: number,
) => {
	if (!range || rows <= 0 || cols <= 0) return null;
	const min = normalizePosition(range.min, rows, cols);
	const max = normalizePosition(range.max, rows, cols);
	if (!min || !max) return null;
	return normalizeRange(min, max);
};

export default function DynamicColumns() {
	const [cols, setCols] = createSignal(4);
	const [data, setData] = createSignal(makeData(5, cols()));
	const [activeCell, setActiveCell] = createSignal<CellPosition | null>({
		row: 0,
		col: 0,
	});
	const [selection, setSelection] = createSignal<CellRange | null>(
		normalizeRange({ row: 0, col: 0 }, { row: 1, col: 1 }),
	);

	const rows = createMemo(() => data().length);

	const setColsSafe = (nextCols: number) => {
		const safeCols = clamp(nextCols, 1, 8);
		setCols(safeCols);
		setData(makeData(5, safeCols));
		setActiveCell((prev) => normalizePosition(prev, rows(), safeCols));
		setSelection((prev) => normalizeSelection(prev, rows(), safeCols));
	};

	const plugins = createPluginHost<string>([
		selectionPlugin(),
		editingPlugin(),
		deletePlugin({ emptyValue: "" }),
		clipboardTextPlugin({ getData: () => data(), emptyValue: "" }),
	]);

	return (
		<>
			<div class="mb-2 flex flex-wrap items-center gap-2">
				<Button onClick={() => setColsSafe(cols() - 1)}>- Columns</Button>
				<Button onClick={() => setColsSafe(cols() + 1)}>+ Columns</Button>
				<span class="font-medium text-neutral-600">Columns: {cols()}</span>
			</div>
			<Gridsheet
				data={data()}
				class={gridsheetStyle}
				renderCell={textCellRenderer}
				activeCell={activeCell()}
				onActiveCellChange={(next) => setActiveCell(next)}
				selection={selection()}
				onSelectionChange={(next) => setSelection(next)}
				onCellsChange={(patches) =>
					setData((prev) => {
						const next = prev.map((row) => row.slice());
						for (const { pos, value } of patches) {
							if (next[pos.row] && pos.col < next[pos.row].length) {
								next[pos.row][pos.col] = value;
							}
						}
						return next;
					})
				}
				onEvent={plugins.onEvent}
			/>
		</>
	);
}
