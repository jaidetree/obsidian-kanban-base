import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { coverageConfigDefaults, defineConfig } from 'vitest/config';

import preact from '@preact/preset-vite';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';

import { playwright } from '@vitest/browser-playwright';

const dirname =
  typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  test: {
    projects: [
      // Unit tests (XState machines, utilities) — run in jsdom
      {
        plugins: [preact()],
        resolve: {
          alias: {
            'obsidian': path.resolve(dirname, 'src/__mocks__/obsidian.ts'),
            'hooks': path.resolve(dirname, 'src/hooks'),
            'types': path.resolve(dirname, 'src/types'),
            'views': path.resolve(dirname, 'src/views'),
          },
        },
        test: {
          name: 'unit',
          include: ['src/**/*.test.ts'],
          environment: 'jsdom',
        },
      },
      // Storybook component tests — run in a real browser via Playwright
      // Note: @storybook/preact-vite already provides the Preact plugin; don't add it again
      {
        extends: true,
        plugins: [
          storybookTest({ configDir: path.join(dirname, '.storybook') }),
        ],
        optimizeDeps: {
          include: ['xstate'],
        },
        test: {
          name: 'storybook',
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [{ browser: 'chromium' }],
          },
          setupFiles: ['.storybook/vitest.setup.ts'],
        },
      },
    ],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        ...coverageConfigDefaults.exclude,
        '**/node_modules/**',
        '**/.storybook/**',
        '**/*.stories.*',
        '**/*.d.ts',
        '**/*.{test,spec}.*',
        '**/*.config.*',
        'src/__mocks__/**',
      ],
    },
  },
});
