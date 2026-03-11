import type { App } from 'obsidian'
import { createContext } from 'preact'
import { useContext } from 'preact/hooks'

export const AppContext = createContext<App | null>(null)

export function useApp(): App {
	const app = useContext(AppContext)
	if (!app) throw new Error('useApp must be used within AppContext.Provider')
	return app
}
