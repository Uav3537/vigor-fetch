import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import dts from 'rollup-plugin-dts';
import alias from '@rollup/plugin-alias';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const aliasPlugin = alias({
  entries: [
    { find: '@core', replacement: path.resolve(__dirname, 'src/core') },
    { find: '@retry', replacement: path.resolve(__dirname, 'src/retry') },
    { find: '@fetch', replacement: path.resolve(__dirname, 'src/fetch') },
    { find: '@parse', replacement: path.resolve(__dirname, 'src/parse') },
    { find: '@all', replacement: path.resolve(__dirname, 'src/all') },
    { find: '@entry', replacement: path.resolve(__dirname, 'src/entry') }
  ]
});

export default [
  {
    input: 'src/index.ts',
    output: [
      { file: 'dist/index.js', format: 'cjs', exports: 'named' },
      { file: 'dist/index.mjs', format: 'esm' }
    ],
    plugins: [
      aliasPlugin,
      resolve(),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
        compilerOptions: {
          "lib": ["ESNext", "DOM", "DOM.Iterable"]
        }
      })
    ]
  },
  {
    input: 'src/index.ts',
    output: [{ file: 'dist/index.d.ts', format: 'esm' }],
    plugins: [
      aliasPlugin,
      dts()
    ]
  }
];