// The Bases view `type:` string this view registers under. Kept obsidian-free so
// it can be imported by the E2E specs' node loader (importing the barrel pulls
// the runtime view, which imports `obsidian` and can't resolve outside Obsidian).
export const KANBAN_ID = 'kanban-base';
