import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  build: {
    outDir: 'docs',
    emptyOutDir: true,
  },

  plugins: [tailwindcss()],

  server: {
    watch: {
      ignored: ['**/coverage/**'],
    },
  },

  test: {
    globals: true,
    coverage: {
      include: ['src/**/*.ts'],
      thresholds: {
        100: true,
      },
    },
  },
});
