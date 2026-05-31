import {copyFileSync, mkdirSync} from "node:fs";
import {dirname, resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {defineConfig} from "vite";
import react from "@vitejs/plugin-react";

const __dirname = dirname(fileURLToPath(import.meta.url));

function copyLibassWasmAssets() {
	return {
		name: "copy-libass-wasm-assets",
		closeBundle() {
			const sourceDir = resolve(__dirname, "node_modules/libass-wasm/dist/js");
			const targetDir = resolve(__dirname, "dist/libass");

			mkdirSync(targetDir, {recursive: true});

			for (const file of [
				"subtitles-octopus-worker.js",
				"subtitles-octopus-worker-legacy.js",
				"subtitles-octopus-worker.wasm",
				"COPYRIGHT"
			]) {
				copyFileSync(resolve(sourceDir, file), resolve(targetDir, file));
			}
		}
	};
}

// https://vite.dev/config/
export default defineConfig({
	plugins: [react(), copyLibassWasmAssets()],
})
