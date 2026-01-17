import { defineConfig } from "astro/config";
import svelte from "@astrojs/svelte";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const rootDir = dirname(fileURLToPath(import.meta.url));
const sharedEntry = resolve(rootDir, "../../packages/shared/src/index.ts");

export default defineConfig({
  integrations: [svelte()],
  vite: {
    resolve: {
      alias: {
        "@daily-verse/shared": sharedEntry
      }
    }
  }
});
