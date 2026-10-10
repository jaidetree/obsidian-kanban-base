export interface CardPlacement {
	path: string
	side: 'before' | 'after'
}

export function parseCardOrder(value: unknown): string[] {
	try {
		const parsed: unknown =
			typeof value === 'string' ? JSON.parse(value) : []
		return Array.isArray(parsed)
			? [
					...new Set(
						parsed.filter(
							(path): path is string => typeof path === 'string',
						),
					),
				]
			: []
	} catch {
		return []
	}
}

/** Saved cards first; newly discovered cards retain the Base's sort order. */
export function applyCardOrder<T extends { file: { path: string } }>(
	entries: T[],
	order: string[],
): T[] {
	const ranks = new Map(order.map((path, index) => [path, index]))
	return [...entries].sort(
		(a, b) =>
			(ranks.get(a.file.path) ?? order.length) -
			(ranks.get(b.file.path) ?? order.length),
	)
}

export function insertCard(
	order: string[],
	path: string,
	placement?: CardPlacement,
): string[] {
	if (placement?.path === path) return order
	const result = order.filter(item => item !== path)
	const target = placement ? result.indexOf(placement.path) : -1
	const index =
		target < 0
			? result.length
			: target + (placement?.side === 'after' ? 1 : 0)
	result.splice(index, 0, path)
	return result
}

/** Keep file and folder renames from discarding manual positions. */
export function renameCardPaths(
	order: string[],
	oldPath: string,
	newPath: string,
): string[] {
	return [
		...new Set(
			order.map(path =>
				path === oldPath || path.startsWith(oldPath + '/')
					? newPath + path.slice(oldPath.length)
					: path,
			),
		),
	]
}

export function findCardPlacement(
	container: HTMLElement,
	clientY: number,
): CardPlacement | undefined {
	const cards = Array.from(
		container.querySelectorAll<HTMLElement>('.kanban-base-card'),
	)
	for (const card of cards) {
		const rect = card.getBoundingClientRect()
		if (clientY < rect.top + rect.height / 2 && card.dataset.filePath) {
			return { path: card.dataset.filePath, side: 'before' }
		}
	}
	const last = cards[cards.length - 1]?.dataset.filePath
	return last ? { path: last, side: 'after' } : undefined
}
