import type { JSX } from "solid-js";

export interface ButtonProps {
	children: JSX.Element;
	onClick: JSX.EventHandlerUnion<HTMLButtonElement, MouseEvent>;
}

export function Button(props: ButtonProps) {
	return (
		<button
			type="button"
			class="rounded border border-neutral-300 bg-neutral-100 px-2 py-1 font-medium text-neutral-800 text-sm transition-colors hover:bg-neutral-50"
			onClick={props.onClick}
		>
			{props.children}
		</button>
	);
}
