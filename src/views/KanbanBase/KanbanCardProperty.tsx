import {
	BasesPropertyId,
	BooleanValue,
	DateValue,
	LinkValue,
	ListValue,
	NullValue,
	NumberValue,
	StringValue,
	TagValue,
	Value,
	parsePropertyId,
} from 'obsidian'

function propertyLabel(propId: BasesPropertyId): string {
	const { name } = parsePropertyId(propId)
	return name.replace(/[-_]/g, ' ')
}

export function formatDate(dateValue: DateValue): string {
	const iso = dateValue.toString()
	const hasTime = iso.includes('T')
	// Append local midnight to avoid UTC-to-local shift on date-only strings
	const date = hasTime ? new Date(iso) : new Date(iso + 'T00:00:00')

	if (hasTime) {
		return date.toLocaleString(undefined, {
			month: 'long',
			day: 'numeric',
			year: 'numeric',
			hour: 'numeric',
			minute: '2-digit',
		})
	}

	return date.toLocaleDateString(undefined, {
		month: 'long',
		day: 'numeric',
		year: 'numeric',
	})
}

function PropertyValue({ propValue }: { propValue: Value }) {
	if (propValue instanceof LinkValue) {
		return <li class="kanban-base-card__item">{propValue.toString()}</li>
	}

	if (propValue instanceof TagValue) {
		return <li class="kanban-base-card__tag">{propValue.toString()}</li>
	}

	if (propValue instanceof StringValue) {
		return <li class="kanban-base-card__item">{propValue.toString()}</li>
	}

	if (propValue instanceof DateValue) {
		return <li class="kanban-base-card__item">{formatDate(propValue)}</li>
	}

	if (propValue instanceof NumberValue) {
		return <li class="kanban-base-card__item">{propValue.toString()}</li>
	}

	if (propValue instanceof NullValue) {
		return null
	}

	throw new Error(
		`Could not display list property value for value ${String(propValue)}`,
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

			if (propValue instanceof NullValue) {
				return null
			}

			const label = propertyLabel(propId)

			if (propValue instanceof TagValue) {
				return (
					<div class="kanban-base-card__property">
						<span class="kanban-base-card__property-label">{label}</span>
						<span class="kanban-base-card__tag">{propValue.toString()}</span>
					</div>
				)
			}

			if (propValue instanceof LinkValue) {
				return (
					<div class="kanban-base-card__property">
						<span class="kanban-base-card__property-label">{label}</span>
						<span class="kanban-base-card__property-value link">{propValue.toString()}</span>
					</div>
				)
			}

			if (propValue instanceof DateValue) {
				return (
					<div class="kanban-base-card__property">
						<span class="kanban-base-card__property-label">{label}</span>
						<span class="kanban-base-card__property-value date">{formatDate(propValue)}</span>
					</div>
				)
			}

			if (propValue instanceof StringValue) {
				return (
					<div class="kanban-base-card__property">
						<span class="kanban-base-card__property-label">{label}</span>
						<span class="kanban-base-card__property-value text">{propValue.toString()}</span>
					</div>
				)
			}

			if (propValue instanceof NumberValue) {
				return (
					<div class="kanban-base-card__property">
						<span class="kanban-base-card__property-label">{label}</span>
						<span class="kanban-base-card__property-value number">{propValue.toString()}</span>
					</div>
				)
			}

			if (propValue instanceof BooleanValue) {
				return (
					<div class="kanban-base-card__property">
						<span class="kanban-base-card__property-label">{label}</span>
						<span class="kanban-base-card__property-value boolean">{propValue.toString()}</span>
					</div>
				)
			}

			throw new Error(
				`KanbanCardProperty: Could not match a render strategy for ${propId} value ${propValue.constructor.name}`,
			)
		}
	}
}
