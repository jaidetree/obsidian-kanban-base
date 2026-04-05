import {
	BasesPropertyId,
	LinkValue,
	ListValue,
	NullValue,
	NumberValue,
	StringValue,
	TagValue,
	Value,
} from 'obsidian'

function parseLink(value: string) {}

function LinkPropertyValue({ propValue }: { propValue: LinkValue }) {
	return <li>{propValue.toString()}</li>
}

function PropertyValue({ propValue }: { propValue: Value }) {
	if (propValue instanceof LinkValue) {
		return <LinkPropertyValue propValue={propValue} />
	}

	if (propValue instanceof TagValue) {
		return <li class="kanban-base-card__tag">{propValue.toString()}</li>
	}

	console.error(propValue)
	throw new Error(
		`Could not display list property value for value ${propValue}`,
	)
}

function ListProperty({ propValue }: { propValue: ListValue }) {
	console.error('ListProperty', propValue)
	const items: Value[] = []

	for (let i = 0; i < propValue.length(); i += 1) {
		const value = propValue.get(i)

		items.push(value)
	}

	return (
		<ul className="kanban-base-card__tags">
			{items.map(itemValue => (
				<PropertyValue propValue={itemValue} />
			))}
		</ul>
	)
}

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
		default: {
			if (propValue instanceof ListValue) {
				return <ListProperty propValue={propValue} />
			}

			if (propValue instanceof LinkValue) {
				console.log('LinkView', propValue)
				return null
			}

			if (propValue instanceof StringValue) {
				console.log('StringValue', propValue)
				return null
			}

			if (propValue instanceof NumberValue) {
				console.log('NumberValue', propValue)
				return null
			}

			if (propValue instanceof NullValue) {
				console.log('NullValue', propValue)
				return null
			}

			throw new Error(
				`KanbanCardProperty: Could not match a render strategy for ${propId} value ${propValue.constructor.name}`,
			)
		}
	}
}
