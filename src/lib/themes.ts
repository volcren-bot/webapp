export const THEMES = [
	{ id: "catppuccin", name: "Catppuccin" },
	{ id: "tokyonight", name: "Tokyo Night" },
	{ id: "gruvbox", name: "Gruvbox Dark" },
	{ id: "nord", name: "Nord" },
	{ id: "rosepine", name: "Rosé Pine" }
] as const

export type ThemeId = (typeof THEMES)[number]["id"]

export const DEFAULT_THEME: ThemeId = "catppuccin"
export const THEME_STORAGE_KEY = "nv-theme"
