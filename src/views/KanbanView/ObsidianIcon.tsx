import { setIcon } from 'obsidian'
import { useEffect, useRef } from 'preact/hooks'

export function ObsidianIcon({
	iconId,
	className,
}: {
	iconId: string
	className?: string
}) {
	const ref = useRef<HTMLSpanElement>(null)
	useEffect(() => {
		if (ref.current) setIcon(ref.current, iconId)
	}, [iconId])
	return (
		<span
			ref={ref}
			class={'kanban-base-icon' + (className ? ' ' + className : '')}
		/>
	)
}
