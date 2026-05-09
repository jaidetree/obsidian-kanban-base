import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/preact'
import { KanbanCardProperty, formatDate } from './KanbanCardProperty'
import {
	MockBooleanValue,
	MockDateValue,
	MockLinkValue,
	MockListValue,
	MockNullValue,
	MockNumberValue,
	MockStringValue,
	MockTagValue,
} from '../../__mocks__/aValue'
import type { BasesPropertyId } from 'obsidian'

function makeId(name: string): BasesPropertyId {
	return `note.${name}` as BasesPropertyId
}

function labelOf(container: Element): string | null {
	return container.querySelector('.kanban-base-card__property-label')?.textContent ?? null
}

describe('KanbanCardProperty', () => {
	it('renders a string value with its label', () => {
		const { container, getByText } = render(
			<KanbanCardProperty propId={makeId('status')} propValue={new MockStringValue('active')} />,
		)
		expect(getByText('active')).toBeTruthy()
		expect(labelOf(container)).toBe('status')
	})

	it('formats hyphenated property names as labels', () => {
		const { container } = render(
			<KanbanCardProperty propId={makeId('due-date')} propValue={new MockStringValue('soon')} />,
		)
		expect(labelOf(container)).toBe('due date')
	})

	it('renders a number value with its label', () => {
		const { container, getByText } = render(
			<KanbanCardProperty propId={makeId('priority')} propValue={new MockNumberValue(42)} />,
		)
		expect(getByText('42')).toBeTruthy()
		expect(labelOf(container)).toBe('priority')
	})

	it('renders a boolean value with its label', () => {
		const { container, getByText } = render(
			<KanbanCardProperty propId={makeId('done')} propValue={new MockBooleanValue(true)} />,
		)
		expect(getByText('true')).toBeTruthy()
		expect(labelOf(container)).toBe('done')
	})

	it('renders a link value with its label', () => {
		const { container, getByText } = render(
			<KanbanCardProperty propId={makeId('related')} propValue={new MockLinkValue('My Note')} />,
		)
		expect(getByText('My Note')).toBeTruthy()
		expect(labelOf(container)).toBe('related')
	})

	it('renders a tag value with its label', () => {
		const { container } = render(
			<KanbanCardProperty propId={makeId('category')} propValue={new MockTagValue('#todo')} />,
		)
		expect(labelOf(container)).toBe('category')
		expect(container.querySelector('.kanban-base-card__tag')?.textContent).toBe('#todo')
	})

	it('renders a date value using locale format with its label', () => {
		const dateValue = new MockDateValue('2026-04-01', 'yesterday')
		const { container, getByText } = render(
			<KanbanCardProperty
				propId={makeId('due')}
				propValue={dateValue}
			/>,
		)
		expect(getByText(formatDate(dateValue))).toBeTruthy()
		expect(labelOf(container)).toBe('due')
	})

	it('renders nothing for a null value', () => {
		const { container } = render(
			<KanbanCardProperty propId={makeId('title')} propValue={new MockNullValue()} />,
		)
		expect(container.firstChild).toBeNull()
	})

	describe('list values', () => {
		it('renders a list without a label', () => {
			const { container } = render(
				<KanbanCardProperty
					propId={makeId('tags')}
					propValue={new MockListValue([new MockTagValue('#todo'), new MockTagValue('#urgent')])}
				/>,
			)
			expect(labelOf(container)).toBeNull()
			const tags = container.querySelectorAll('.kanban-base-card__tag')
			expect(tags).toHaveLength(2)
			expect(tags[0]!.textContent).toBe('#todo')
			expect(tags[1]!.textContent).toBe('#urgent')
		})

		it('renders a list of strings as list items', () => {
			const { getByText } = render(
				<KanbanCardProperty
					propId={makeId('items')}
					propValue={new MockListValue([new MockStringValue('alpha'), new MockStringValue('beta')])}
				/>,
			)
			expect(getByText('alpha')).toBeTruthy()
			expect(getByText('beta')).toBeTruthy()
		})

		it('renders a list of numbers', () => {
			const { getByText } = render(
				<KanbanCardProperty
					propId={makeId('scores')}
					propValue={new MockListValue([new MockNumberValue(1), new MockNumberValue(2)])}
				/>,
			)
			expect(getByText('1')).toBeTruthy()
			expect(getByText('2')).toBeTruthy()
		})

		it('renders a list of links', () => {
			const { getByText } = render(
				<KanbanCardProperty
					propId={makeId('refs')}
					propValue={new MockListValue([new MockLinkValue('Note A'), new MockLinkValue('Note B')])}
				/>,
			)
			expect(getByText('Note A')).toBeTruthy()
			expect(getByText('Note B')).toBeTruthy()
		})

		it('renders a list of dates using locale format', () => {
			const date1 = new MockDateValue('2026-04-01', 'yesterday')
			const date2 = new MockDateValue('2026-04-07', 'tomorrow')
			const { container } = render(
				<KanbanCardProperty
					propId={makeId('dates')}
					propValue={new MockListValue([date1, date2])}
				/>,
			)
			const items = container.querySelectorAll('li')
			expect(items).toHaveLength(2)
			expect(items[0]!.textContent).toBe(formatDate(date1))
			expect(items[1]!.textContent).toBe(formatDate(date2))
		})

		it('skips null items in a list', () => {
			const { container } = render(
				<KanbanCardProperty
					propId={makeId('mixed')}
					propValue={new MockListValue([new MockNullValue(), new MockStringValue('visible')])}
				/>,
			)
			const items = container.querySelectorAll('li')
			expect(items).toHaveLength(1)
			expect(items[0]!.textContent).toBe('visible')
		})
	})
})
