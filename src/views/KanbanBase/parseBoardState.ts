import type { BasesViewConfig } from 'obsidian'
import type { ColumnRecord } from '../../machines/boardMachine'

export function parseBoardState(config: BasesViewConfig): ColumnRecord[] {
	try {
		const raw = config.get('boardState')
		if (!raw || typeof raw !== 'string') return []
		const parsed = JSON.parse(raw) as unknown
		if (!Array.isArray(parsed)) return []
		return parsed.filter(
			(item): item is ColumnRecord =>
				typeof item === 'object' &&
				item !== null &&
				typeof (item as Record<string, unknown>).name === 'string',
		)
	} catch {
		return []
	}
}
