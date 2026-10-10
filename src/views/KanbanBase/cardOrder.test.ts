import { describe, expect, it } from 'vitest'
import {
	applyCardOrder,
	insertCard,
	parseCardOrder,
	renameCardPaths,
} from './cardOrder'

describe('persistent card order', () => {
	it('tolerates missing, malformed, and duplicate saved values', () => {
		for (const value of [null, undefined, 'broken', '{}'])
			expect(parseCardOrder(value)).toEqual([])
		expect(parseCardOrder('["b",null,3,"a","b"]')).toEqual(['b', 'a'])
	})
	it('preserves Base sorting until reordered; appends new cards without losing entries', () => {
		const entries = ['a', 'b', 'c', 'd'].map(path => ({ file: { path } }))
		expect(applyCardOrder(entries, [])).toEqual(entries)
		expect(
			applyCardOrder(entries, ['missing', 'c', 'a']).map(
				e => e.file.path,
			),
		).toEqual(['c', 'a', 'b', 'd'])
		expect(entries.map(e => e.file.path)).toEqual(['a', 'b', 'c', 'd'])
	})
	it('moves up, down, to the end, and into an empty column', () => {
		expect(
			insertCard(['a', 'b', 'c'], 'c', { path: 'a', side: 'before' }),
		).toEqual(['c', 'a', 'b'])
		expect(
			insertCard(['a', 'b', 'c'], 'a', { path: 'b', side: 'after' }),
		).toEqual(['b', 'a', 'c'])
		expect(insertCard(['a', 'b', 'c'], 'a')).toEqual(['b', 'c', 'a'])
		expect(insertCard([], 'a')).toEqual(['a'])
		expect(
			insertCard(['a', 'b'], 'a', { path: 'a', side: 'after' }),
		).toEqual(['a', 'b'])
	})
	it('preserves positions for renamed notes and entire folders, with path boundaries', () => {
		const order = ['Next/b.md', 'Next/a.md', 'Next-extra/c.md']
		expect(renameCardPaths(order, 'Next/b.md', 'Next/new.md')).toEqual([
			'Next/new.md',
			'Next/a.md',
			'Next-extra/c.md',
		])
		expect(renameCardPaths(order, 'Next', 'Doing')).toEqual([
			'Doing/b.md',
			'Doing/a.md',
			'Next-extra/c.md',
		])
	})
})
