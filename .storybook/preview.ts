import type { Preview } from '@storybook/svelte-vite';

const preview: Preview = {
  parameters: {
    backgrounds: { disable: true },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      // 'todo' - show violations in test UI only
      // 'error' - fail CI on violations
      // 'off' - skip a11y checks
      test: 'todo',
    },
  },
};

export default preview;
