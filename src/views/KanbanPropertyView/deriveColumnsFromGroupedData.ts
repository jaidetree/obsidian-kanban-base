import type { BasesEntryGroup } from 'obsidian'
import { StringValue } from 'obsidian'
import type { IKanbanPropertyColumn } from './types'

export type DeriveResult =
	| { kind: 'no-group-by' }
	| { kind: 'unsupported-type' }
	| { kind: 'columns'; columns: IKanbanPropertyColumn[] }

/**
 * Derive Kanban columns from a Bases grouped-data result and a list of
 * user-defined column names (empty workflow columns that persist across
 * data refreshes).
 *
 * Returns a discriminated union:
 *  - 'no-group-by'       — no group-by is configured (all groups lack a key)
 *  - 'unsupported-type'  — the group-by field is not a text/status property
 *  - 'columns'           — happy path; caller should wire up boardMachine
 *
 * @param groupByConfigured — pass `true` when the Bases config has a group-by
 *   property set. When true, the all-keyless data pattern is treated as
 *   "group-by set but no notes have that property value yet" (returns 'columns'
 *   with an empty named set + Uncategorized) rather than 'no-group-by'.
 *
 * Column order: named (from API order) → user-defined extras → Uncategorized.
 * boardMachine handles persisted user reordering on top of this default.
 */
export function deriveColumnsFromGroupedData(
	groups: BasesEntryGroup[],
	userDefinedColumns: string[],
	groupByConfigured = false,
): DeriveResult {
	// No group-by: every group lacks a key AND we know group-by is not set
	if (!groupByConfigured && (groups.length === 0 || groups.every(g => !g.hasKey()))) {
		return { kind: 'no-group-by' }
	}

	// Unsupported type: first keyed group has a non-string key
	const firstKeyed = groups.find(g => g.hasKey())
	if (firstKeyed && !(firstKeyed.key instanceof StringValue)) {
		return { kind: 'unsupported-type' }
	}

	// Named columns — one per keyed group, in API order
	const named: IKanbanPropertyColumn[] = groups
		.filter(g => g.hasKey())
		.map(g => ({
			name: g.key!.toString(),
			entries: g.entries,
			isUncategorized: false,
		}))

	const namedNames = new Set(named.map(c => c.name))

	// User-defined extras — empty workflow columns not yet present in data
	const userExtras: IKanbanPropertyColumn[] = userDefinedColumns
		.filter(name => !namedNames.has(name))
		.map(name => ({ name, entries: [], isUncategorized: false }))

	// Uncategorized — merge entries from all keyless groups (if any)
	const keylessEntries = groups
		.filter(g => !g.hasKey())
		.flatMap(g => g.entries)

	const uncategorized: IKanbanPropertyColumn[] =
		keylessEntries.length > 0
			? [{ name: 'Uncategorized', entries: keylessEntries, isUncategorized: true }]
			: []

	return {
		kind: 'columns',
		columns: [...named, ...userExtras, ...uncategorized],
	}
}
