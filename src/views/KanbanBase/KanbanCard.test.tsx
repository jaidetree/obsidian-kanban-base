import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/preact'
import { Menu } from 'obsidian'
import { KanbanCard } from './KanbanCard'
import { AppContext } from './AppContext'
import { createMockApp } from '../../__mocks__/create-mock-app'
import { aBasesEntry } from '../../__mocks__/aBasesEntry'
import { aFile } from '../../__mocks__/aFile'

// The mocked `Menu.addItem` never renders real menu items to the DOM (a real
// context menu can't be driven this way in tests), so we capture the item
// builders directly and invoke the one we want by title, simulating the user
// picking that item from the (untestable) menu UI.
function captureMenuItems() {
	const items: { title?: string; onClick?: () => void }[] = []
	vi.spyOn(Menu.prototype, 'addItem').mockImplementation(function (
		this: Menu,
		builder: (item: {
			setTitle: (t: string) => unknown
			setIcon: (i: string) => unknown
			onClick: (cb: () => void) => unknown
		}) => void,
	) {
		const item = {
			_title: undefined as string | undefined,
			_onClick: undefined as (() => void) | undefined,
			setTitle(t: string) {
				item._title = t
				return item
			},
			setIcon() {
				return item
			},
			onClick(cb: () => void) {
				item._onClick = cb
				return item
			},
		}
		builder(item)
		items.push({ title: item._title, onClick: item._onClick })
		return this
	})
	return items
}

function clickMenuItem(items: { title?: string; onClick?: () => void }[], title: string) {
	const item = items.find(i => i.title === title)
	if (!item?.onClick) throw new Error(`Menu item "${title}" not found`)
	item.onClick()
}

describe('KanbanCard rename', () => {
	it('renames the file when the inline form is submitted via the checkmark button', async () => {
		const renameFile = vi.fn().mockResolvedValue(undefined)
		const app = createMockApp({
			fileManager: {
				renameFile,
			} as never,
		})
		const file = aFile({ basename: 'Old Title', path: 'Books/Old Title.md', parent: { path: 'Books' } as never })
		const entry = aBasesEntry({ file })

		const menuItems = captureMenuItems()

		const { container, getByTitle } = render(
			<AppContext.Provider value={app}>
				<KanbanCard
					entry={entry}
					cardProperties={[]}
					onDragStart={() => {}}
					onDragCancel={() => {}}
				/>
			</AppContext.Provider>,
		)

		fireEvent.click(container.querySelector('.kanban-base-card-menu-btn')!)
		clickMenuItem(menuItems, 'Rename')
		await new Promise(resolve => setTimeout(resolve, 0))

		const input = container.querySelector<HTMLInputElement>('.kanban-base-inline-form__input')!
		expect(input).toBeTruthy()
		fireEvent.input(input, { target: { value: 'New Title' } })

		// Submit via the checkmark button, exactly like a real user click -
		// this must trigger the form's real submit event, not a direct call.
		fireEvent.click(getByTitle('Save'))

		await Promise.resolve()
		await Promise.resolve()

		expect(renameFile).toHaveBeenCalledWith(file, 'Books/New Title.md')
		expect(container.querySelector('.kanban-base-inline-form__input')).toBeNull()
	})
})
