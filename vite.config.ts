import {copyFileSync, mkdirSync} from "node:fs";
import {dirname, resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {defineConfig} from "vite";
import react from "@vitejs/plugin-react";

const apiServer = process.env.VITE_API_SERVER ?? "http://localhost:5165";
const __dirname = dirname(fileURLToPath(import.meta.url));

function copyLibassWasmAssets() {
	return {
		name: "copy-libass-wasm-assets",
		configureServer() {
			copyAssets();
		},
		closeBundle() {
			copyAssets();
		}
	};

	function copyAssets() {
		const sourceDir = resolve(__dirname, "node_modules/libass-wasm/dist/js");
		const targetDir = resolve(__dirname, "public/libass");

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
}

// https://vite.dev/config/
export default defineConfig({
	plugins: [react(), copyLibassWasmAssets()],
	server: {
		proxy: {
			"/api": {
				target: apiServer,
				changeOrigin: true,
			},
			"/Media": {
				target: apiServer,
				changeOrigin: true,
			},
		},
	},
})
