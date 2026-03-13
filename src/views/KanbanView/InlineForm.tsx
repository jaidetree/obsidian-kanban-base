import { TargetedInputEvent, TargetedKeyboardEvent } from 'preact'
import { ObsidianIcon } from './ObsidianIcon'

interface InlineFormProps {
	value: string
	placeholder?: string
	onInput: (e: TargetedInputEvent<HTMLInputElement>) => void
	onSubmit: (e: SubmitEvent) => void
	onCancel: () => void
}

export function InlineForm({
	value,
	placeholder,
	onInput,
	onSubmit,
	onCancel,
}: InlineFormProps) {
	function handleKeyDown(e: TargetedKeyboardEvent<HTMLFormElement>) {
		switch (e.key) {
			case 'Enter':
				e.currentTarget.requestSubmit()
				break

			case 'Escape': {
				onCancel()
				break
			}
		}
	}

	function handleSubmit(e: SubmitEvent) {
		e.preventDefault()
		onSubmit(e)
	}

	return (
		<form
			class="kanban-base-inline-form"
			onKeyDown={handleKeyDown}
			onSubmit={handleSubmit}
		>
			<input
				class="kanban-base-inline-form__input"
				placeholder={placeholder}
				value={value}
				onInput={onInput}
				ref={el => {
					if (el) el.focus()
				}}
			/>
			<button class="kanban-base-inline-form__submit" title="Save">
				<ObsidianIcon iconId="lucide-check" />
			</button>
			<button
				class="kanban-base-inline-form__cancel"
				title="Cancel"
				onClick={() => onCancel()}
				type="button"
			>
				<ObsidianIcon iconId="lucide-x" />
			</button>
		</form>
	)
}
