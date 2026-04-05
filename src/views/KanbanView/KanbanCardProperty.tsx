import {
	BasesPropertyId,
	BooleanValue,
	LinkValue,
	ListValue,
	NullValue,
	NumberValue,
	StringValue,
	TagValue,
	Value,
} from 'obsidian'

function PropertyValue({ propValue }: { propValue: Value }) {
	if (propValue instanceof LinkValue) {
		return <li>{propValue.toString()}</li>
	}

	if (propValue instanceof TagValue) {
		return <li class="kanban-base-card__tag">{propValue.toString()}</li>
	}

	if (propValue instanceof StringValue) {
		return <li>{propValue.toString()}</li>
	}

	if (propValue instanceof NumberValue) {
		return <li>{propValue.toString()}</li>
	}

	if (propValue instanceof NullValue) {
		return null
	}

	throw new Error(
		`Could not display list property value for value ${propValue}`,
	)
}

function ListProperty({ propValue }: { propValue: ListValue }) {
	const items: Value[] = []

	for (let i = 0; i < propValue.length(); i += 1) {
		items.push(propValue.get(i))
	}

	return (
		<ul className="kanban-base-card__tags">
			{items.map((itemValue, i) => (
				<PropertyValue key={i} propValue={itemValue} />
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
	switch (propId) {
		default: {
			if (propValue instanceof ListValue) {
				return <ListProperty propValue={propValue} />
			}

			if (propValue instanceof TagValue) {
				return <span class="kanban-base-card__tag">{propValue.toString()}</span>
			}

			if (propValue instanceof LinkValue) {
				return (
					<span className="kanban-base-card__property-link">
						{propValue.toString()}
					</span>
				)
			}

			if (propValue instanceof StringValue) {
				return (
					<span className="kanban-base-card__property-text">
						{propValue.toString()}
					</span>
				)
			}

			if (propValue instanceof NumberValue) {
				return (
					<span className="kanban-base-card__property-number">
						{propValue.toString()}
					</span>
				)
			}

			if (propValue instanceof BooleanValue) {
				return (
					<span className="kanban-base-card__property-boolean">
						{propValue.toString()}
					</span>
				)
			}

			if (propValue instanceof NullValue) {
				return null
			}

			throw new Error(
				`KanbanCardProperty: Could not match a render strategy for ${propId} value ${propValue.constructor.name}`,
			)
		}
	}
}
