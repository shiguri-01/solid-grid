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
				replacement: "../src/preset-tailwind.css",
			},
		],
	},
});
