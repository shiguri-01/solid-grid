import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import solid from "vite-plugin-solid";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
	plugins: [tailwindcss(), solid(), tsconfigPaths()],
	resolve: {
		alias: [
			{
				find: "@shiguri/solid-grid/preset-tailwind.css",
				replacement: path.resolve(__dirname, "../src/preset-tailwind.css"),
			},
			// Ensure `solid-js` imports from the parent directory (`../src`) resolve to the local `node_modules`.
			// This prevents dual instances of the runtime, which is required for reactivity to work correctly.
			{
				find: /^solid-js$/,
				replacement: path.resolve(__dirname, "node_modules/solid-js"),
			},
			{
				find: /^solid-js\/web$/,
				replacement: path.resolve(__dirname, "node_modules/solid-js/web"),
			},
			{
				find: /^solid-js\/store$/,
				replacement: path.resolve(__dirname, "node_modules/solid-js/store"),
			},
		],
	},
});
