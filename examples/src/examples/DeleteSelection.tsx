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

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const toColLabel = (colIndex: number) => {
	let label = "";
	let n = colIndex + 1;
	while (n > 0) {
		const rem = (n - 1) % 26;
		label = ALPHABET[rem] + label;
		n = Math.floor((n - 1) / 26);
	}
	return label;
};

const formatPos = (pos: CellPosition | null) =>
	pos ? `${toColLabel(pos.col)}${pos.row + 1}` : "none";

const formatRange = (range: CellRange | null) =>
	range
		? `${toColLabel(range.min.col)}${range.min.row + 1}:${toColLabel(
				range.max.col,
			)}${range.max.row + 1}`
		: "none";

export default function ControlledState() {
	const [data, setData] = createSignal(makeData(6, 6));
	const [activeCell, setActiveCell] = createSignal<CellPosition | null>({
		row: 0,
		col: 0,
	});
	const [selection, setSelection] = createSignal<CellRange | null>(
		normalizeRange({ row: 0, col: 0 }, { row: 1, col: 2 }),
	);
	const [isEditing, setIsEditing] = createSignal(false);

	const selectionLabel = createMemo(() => formatRange(selection()));

	const plugins = createPluginHost<string>([
		selectionPlugin(),
		editingPlugin(),
		deletePlugin({ emptyValue: "" }),
		clipboardTextPlugin({ getData: () => data(), emptyValue: "" }),
	]);

	return (
		<>
			<div class="mb-2 flex flex-wrap gap-2">
				<Button
					onClick={() => {
						setActiveCell({ row: 0, col: 0 });
						setSelection(
							normalizeRange({ row: 0, col: 0 }, { row: 2, col: 2 }),
						);
					}}
				>
					Select A1:C3
				</Button>
				<Button
					onClick={() => {
						setActiveCell(null);
						setSelection(null);
					}}
				>
					Clear selection
				</Button>
			</div>
			<div class="mb-2 flex flex-wrap gap-4 font-medium text-neutral-600">
				<span>Active: {formatPos(activeCell())}</span>
				<span> Selection: {selectionLabel()} </span>
				<span> Editing: {isEditing() ? "true" : "false"} </span>
			</div>
			<Gridsheet
				data={data()}
				class={gridsheetStyle}
				renderCell={textCellRenderer}
				activeCell={activeCell()}
				onActiveCellChange={(next) => setActiveCell(next)}
				selection={selection()}
				onSelectionChange={(next) => setSelection(next)}
				isEditing={isEditing()}
				onIsEditingChange={(next) => setIsEditing(next)}
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
