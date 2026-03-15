import { BasesPropertyId, Value } from 'obsidian'

interface KanbanCardPropertyProps {
	propId: BasesPropertyId
	propValue: Value
}

export function KanbanCardProperty({
	propId,
	propValue,
}: KanbanCardPropertyProps) {
	console.log({ propId, propValue })

	switch (propId) {
		default:
			return propValue.toString()
	}
}
