import { For } from "solid-js";
import BasicGrid from "./examples/BasicGrid";
import ClipboardMemory from "./examples/Clipboard";
import CreateStoreGrid from "./examples/CreateStoreGrid";
import CssStyledGrid from "./examples/CssStyledGrid";
import CustomHeaders from "./examples/CustomHeaders";
import ControlledState from "./examples/DeleteSelection";
import DynamicColumns from "./examples/DynamicColumns";
import NumericValidation from "./examples/NumericValidation";

const REPO_URL = "https://github.com/shiguri-01/solid-grid";

function Title() {
	return (
		<h1 class="text-lg">
			<span class="font-medium">Solid Grid</span>
			<span class="text-neutral-600"> Examples</span>
		</h1>
	);
}

function App() {
	const examples = [
		{
			id: "basic",
			title: "Basic",
			Component: BasicGrid,
		},
		{
			id: "css",
			title: "CSS Styling",
			Component: CssStyledGrid,
		},
		{
			id: "headers",
			title: "Custom Headers",
			Component: CustomHeaders,
		},
		{
			id: "numeric",
			title: "Numeric Validation",
			Component: NumericValidation,
		},
		{
			id: "controlled",
			title: "Controlled State",
			Component: ControlledState,
		},
		{
			id: "dynamic-data",
			title: "Dynamic Data",
			Component: DynamicColumns,
		},
		{
			id: "store",
			title: "createStore Data",
			Component: CreateStoreGrid,
		},
		{
			id: "clipboard",
			title: "In-Memory Clipboard",
			Component: ClipboardMemory,
		},
	];

	return (
		<div class="min-h-screen px-4 pt-4 pb-8 lg:grid lg:grid-cols-[220px_1fr] lg:p-0">
			<nav class="hidden lg:block">
				<div class="sticky top-0 flex h-screen flex-col gap-6 overflow-y-auto px-4 py-6">
					<Title />
					<div class="grid gap-1">
						<For each={examples}>
							{(example) => (
								<a
									href={`#${example.id}`}
									class="rounded px-2 py-1 hover:bg-neutral-200"
								>
									<span>{example.title}</span>
								</a>
							)}
						</For>
					</div>

					<a
						href={REPO_URL}
						target="_blank"
						rel="noopener noreferrer"
						class="mt-auto block text-neutral-600 text-sm hover:text-neutral-950 hover:underline"
					>
						GitHub
					</a>
				</div>
			</nav>
			<div class="mb-4 lg:hidden">
				<Title />
			</div>

			<div class="mx-auto contents w-full max-w-5xl px-8 pt-6 pb-12 lg:block">
				<div class="space-y-12">
					<For each={examples}>
						{(example) => {
							const Example = example.Component;
							return (
								<section id={example.id}>
									<h2 class="mb-4 px-2 text-3xl">{example.title}</h2>
									<div class="overflow-auto">
										<Example />
									</div>
								</section>
							);
						}}
					</For>
				</div>
			</div>
		</div>
	);
}

export default App;
