import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/preact'
import { KanbanCardProperty } from './KanbanCardProperty'
import {
	MockBooleanValue,
	MockLinkValue,
	MockListValue,
	MockNullValue,
	MockNumberValue,
	MockStringValue,
	MockTagValue,
} from '../../__mocks__/aValue'
import type { BasesPropertyId } from 'obsidian'

const propId = 'note.title' as BasesPropertyId

describe('KanbanCardProperty', () => {
	it('renders a string value', () => {
		const { getByText } = render(
			<KanbanCardProperty propId={propId} propValue={new MockStringValue('hello world')} />,
		)
		expect(getByText('hello world')).toBeTruthy()
	})

	it('renders a number value', () => {
		const { getByText } = render(
			<KanbanCardProperty propId={propId} propValue={new MockNumberValue(42)} />,
		)
		expect(getByText('42')).toBeTruthy()
	})

	it('renders a boolean true value', () => {
		const { getByText } = render(
			<KanbanCardProperty propId={propId} propValue={new MockBooleanValue(true)} />,
		)
		expect(getByText('true')).toBeTruthy()
	})

	it('renders a boolean false value', () => {
		const { getByText } = render(
			<KanbanCardProperty propId={propId} propValue={new MockBooleanValue(false)} />,
		)
		expect(getByText('false')).toBeTruthy()
	})

	it('renders a link value', () => {
		const { getByText } = render(
			<KanbanCardProperty propId={propId} propValue={new MockLinkValue('My Note')} />,
		)
		expect(getByText('My Note')).toBeTruthy()
	})

	it('renders a tag value', () => {
		const { getByText } = render(
			<KanbanCardProperty propId={propId} propValue={new MockTagValue('#todo')} />,
		)
		const el = getByText('#todo')
		expect(el.className).toBe('kanban-base-card__tag')
	})

	it('renders nothing for a null value', () => {
		const { container } = render(
			<KanbanCardProperty propId={propId} propValue={new MockNullValue()} />,
		)
		expect(container.firstChild).toBeNull()
	})

	describe('list values', () => {
		it('renders a list of tags', () => {
			const { container } = render(
				<KanbanCardProperty
					propId={propId}
					propValue={new MockListValue([new MockTagValue('#todo'), new MockTagValue('#urgent')])}
				/>,
			)
			const tags = container.querySelectorAll('.kanban-base-card__tag')
			expect(tags).toHaveLength(2)
			expect(tags[0]!.textContent).toBe('#todo')
			expect(tags[1]!.textContent).toBe('#urgent')
		})

		it('renders a list of strings as list items', () => {
			const { getByText } = render(
				<KanbanCardProperty
					propId={propId}
					propValue={new MockListValue([new MockStringValue('alpha'), new MockStringValue('beta')])}
				/>,
			)
			expect(getByText('alpha')).toBeTruthy()
			expect(getByText('beta')).toBeTruthy()
		})

		it('renders a list of numbers', () => {
			const { getByText } = render(
				<KanbanCardProperty
					propId={propId}
					propValue={new MockListValue([new MockNumberValue(1), new MockNumberValue(2)])}
				/>,
			)
			expect(getByText('1')).toBeTruthy()
			expect(getByText('2')).toBeTruthy()
		})

		it('renders a list of links', () => {
			const { getByText } = render(
				<KanbanCardProperty
					propId={propId}
					propValue={new MockListValue([new MockLinkValue('Note A'), new MockLinkValue('Note B')])}
				/>,
			)
			expect(getByText('Note A')).toBeTruthy()
			expect(getByText('Note B')).toBeTruthy()
		})

		it('skips null items in a list', () => {
			const { container } = render(
				<KanbanCardProperty
					propId={propId}
					propValue={new MockListValue([new MockNullValue(), new MockStringValue('visible')])}
				/>,
			)
			const items = container.querySelectorAll('li')
			expect(items).toHaveLength(1)
			expect(items[0]!.textContent).toBe('visible')
		})
	})
})
