import { defineConfig } from "tsup"

export default defineConfig({
    entry: ["src/index.ts"],
    format: ["cjs", "esm"],
    dts: true,
    clean: true,
    sourcemap: false,
    target: "esnext",
    // Rollup tree-shaking drops dead code that esbuild leaves behind
    treeshake: true,
    // Terser instead of esbuild's minifier: esbuild cannot mangle locals while leaving top-level names alone,
    // and its `keepNames` helper adds bytes to every consumer bundle
    minify: "terser",
    terserOptions: {
        ecma: 2020,
        // Classes are emitted as `var Name = class {}`, so `.name` comes from the top-level binding.
        // Leave top-level bindings alone (no renaming, no inlining) so class names survive
        // (`new.target.name` in src/core/error.ts, stack traces); consumer bundlers rename them anyway
        compress: { passes: 2, module: false, toplevel: false, keep_classnames: true },
        mangle: { module: false, toplevel: false, keep_classnames: true },
        format: { comments: false },
    },
})
