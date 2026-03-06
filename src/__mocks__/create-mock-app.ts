import type { App, TFile } from "obsidian";

export const createMockApp = (overrides?: Partial<App>): App => {
  return {
    fileManager: {
      processFrontMatter: (_file: TFile, _processor: (fm: Record<string, unknown>) => void) => {
        // no-op stub
      },
    },
    metadataCache: {
      getFirstLinkpathDest: (_linkpath: string, _sourcePath: string) => null,
      getFileCache: (_file: TFile) => ({ frontmatter: {} }),
    },
    vault: {
      adapter: {
        getResourcePath: (path: string): string => `/mock-resource/${path}`,
      },
      read: async (_file: TFile): Promise<string> => '',
      rename: async (_file: TFile, _newPath: string): Promise<void> => {},
      create: async (_path: string, _data: string): Promise<TFile> => ({} as TFile),
      createFolder: async (_path: string): Promise<void> => {},
    },
    workspace: {
      openLinkText: async (_linktext: string, _sourcePath: string, _newLeaf: boolean): Promise<void> => {},
      trigger: (_event: string, ..._args: unknown[]) => {},
      ...(overrides?.workspace ?? {}),
    },
    ...overrides,
  } as unknown as App;
};
