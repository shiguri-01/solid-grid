import solid from "rolldown-plugin-solid";
import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["./src/index.tsx", "./src/presets.tsx"],
  platform: "neutral",
  dts: true,
  sourcemap: true,
  plugins: [solid()],
});
