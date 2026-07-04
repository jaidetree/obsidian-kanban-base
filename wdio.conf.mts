import * as path from 'path';

// End-to-end seam: WebdriverIO drives a real, sandboxed Obsidian via
// wdio-obsidian-service and opens this plugin's registered Bases Kanban views —
// the one surface the Storybook/vitest suite (which mocks `obsidian`) cannot
// reach. See docs/adr/0001-e2e-wdio-obsidian-bases.md and the e2e-pipeline PRD.
//
// Binary source differs by environment; the spec code is identical:
//   - CI / default: OBSIDIAN_BINARY_PATH unset → the service downloads a pinned
//     Obsidian, cached in .obsidian-cache between runs.
//   - Local dev: point OBSIDIAN_BINARY_PATH at an installed Obsidian to skip the
//     download, e.g. on macOS:
//       export OBSIDIAN_BINARY_PATH="/Applications/Obsidian.app/Contents/MacOS/Obsidian"
//     When driving a local binary, OBSIDIAN_INSTALLER_VERSION MUST match that
//     binary's Electron version (it selects the ChromeDriver) — override it,
//     e.g. OBSIDIAN_INSTALLER_VERSION=latest.
const binaryPath = process.env.OBSIDIAN_BINARY_PATH;

// appVersion selects the Obsidian app JS; installerVersion selects the
// installer/Electron the service matches ChromeDriver to. The default pins a
// known-good Bases build on the earliest supported installer for
// reproducibility; both are env-overridable.
//
// NB: pin a *stable* release — 1.10.2 (our manifest minAppVersion) is an
// Insiders-only beta and needs OBSIDIAN_EMAIL/PASSWORD to download. 1.10.6 is
// the nearest stable 1.10.x, downloadable without an Insiders account.
const appVersion = process.env.OBSIDIAN_APP_VERSION ?? '1.10.6';
const installerVersion = process.env.OBSIDIAN_INSTALLER_VERSION ?? 'earliest';

const obsidianOptions = {
	installerVersion,
	plugins: ['.'],
	vault: 'test/vaults/kanban',
	...(binaryPath ? { binaryPath } : {}),
};

export const config: WebdriverIO.Config = {
	runner: 'local',
	framework: 'mocha',
	specs: ['./test/specs/**/*.e2e.ts'],
	maxInstances: 1,

	capabilities: [
		{
			browserName: 'obsidian',
			browserVersion: appVersion,
			'wdio:obsidianOptions': obsidianOptions,
		},
	],

	services: ['obsidian'],
	// The obsidian reporter wraps the spec reporter to surface the Obsidian version.
	reporters: ['obsidian'],

	// wdio-obsidian-service downloads Obsidian versions here (git-ignored, cached in CI).
	cacheDir: path.resolve('.obsidian-cache'),

	mochaOpts: {
		ui: 'bdd',
		timeout: 60000,
	},

	// `e2e:dev` sets E2E_DEV for a headed, warm-cache diagnosis loop with verbose
	// logs; `test:e2e` (CI, run under xvfb) stays quiet.
	logLevel: process.env.E2E_DEV ? 'info' : 'warn',
};
