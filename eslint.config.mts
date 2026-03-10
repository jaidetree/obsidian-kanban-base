// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

import tseslint from 'typescript-eslint';
import obsidianmd from "eslint-plugin-obsidianmd";
import globals from "globals";
import { globalIgnores } from "eslint/config";

export default tseslint.config({
    languageOptions: {
        globals: {
            ...globals.browser,
        },
        parserOptions: {
            projectService: {
                allowDefaultProject: [
                    'eslint.config.js',
                    'manifest.json',
                    '.storybook/*.ts',
                    'vitest.config.ts',
                    'vitest.shims.d.ts',
                    'prettier.config.ts',
                ]
            },
            tsconfigRootDir: import.meta.dirname,
            extraFileExtensions: ['.json']
        },
    },
}, ...obsidianmd.configs.recommended, {
    // Relax strict rules for mocks and tests — casts and any are necessary
    files: ['src/__mocks__/**', 'src/**/*.test.ts', 'src/**/*.stories.tsx'],
    rules: {
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-base-to-string': 'off',
        'obsidianmd/no-tfile-tfolder-cast': 'off',
    },
}, {
    // Config files live outside src/ and legitimately use node builtins and dev deps
    files: ['.storybook/**', 'vitest.config.ts'],
    rules: {
        'import/no-nodejs-modules': 'off',
        'import/no-extraneous-dependencies': 'off',
        'no-undef': 'off',
    },
}, globalIgnores([
    "node_modules",
    "dist",
    "esbuild.config.mjs",
    "eslint.config.js",
    "version-bump.mjs",
    "versions.json",
    "main.js",
]), storybook.configs["flat/recommended"]);
