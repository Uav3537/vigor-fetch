import * as esm from "./dist/index.mjs";
import * as cjs from "./dist/index.js";

if (!Object.keys(esm).length) throw new Error("ESM broken");
if (!Object.keys(cjs).length) throw new Error("CJS broken");