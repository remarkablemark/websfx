import { defineConfig, type UserConfig } from 'tsdown';

const config = {
  globalName: 'websfx',
  sourcemap: true,
} satisfies UserConfig;

export default defineConfig([
  {
    ...config,
    format: ['esm', 'cjs', 'umd'],
  },

  {
    ...config,
    format: 'umd',
    platform: 'browser',
    minify: true,
    outputOptions: {
      entryFileNames: '[name].umd.min.js',
    },
  },
]);
