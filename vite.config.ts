import { defineConfig } from "vitest/config";
import dts from "vite-plugin-dts";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, "src/index.ts"),
        react: resolve(__dirname, "src/react.ts"),
        preact: resolve(__dirname, "src/preact.ts"),
        remix: resolve(__dirname, "src/remix.ts"),
        zod: resolve(__dirname, "src/zod.ts"),
      },
      formats: ["es", "cjs"],
    },
    rollupOptions: {
      output: {
        exports: "named",
      },
      external: ["react", "preact", "preact/hooks"],
    },
    sourcemap: true,
    minify: "terser",
  },
  esbuild: {
    jsx: "automatic",
    jsxImportSource: "react",
  },
  plugins: [
    dts({
      tsconfigPath: "./tsconfig.json",
      staticImport: true,
      insertTypesEntry: true,
      pathsToAliases: true,
      compilerOptions: {
        declarationMap: false,
      },
    }),
  ],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
    },
    include: ["src/**/*.{test,spec}.{js,ts,jsx,tsx}"],
    exclude: ["**/node_modules/**", "**/dist/**"],
    testTimeout: 10000,
    includeSource: ["src/**/*.{js,ts}"],
  },
});
