import { defineConfig } from 'tsdown';

export default defineConfig([
  {
    format: ['esm', 'cjs', 'umd'],
    globalName: 'websfx',
    sourcemap: true,
  },
  {
    format: 'umd',
    globalName: 'websfx',
    platform: 'browser',
    sourcemap: true,
    minify: true,
    outputOptions: {
      entryFileNames: '[name].umd.min.js',
    },
  },
]);
