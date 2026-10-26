export const THEMES = [
	{ id: "tokyonight", name: "Tokyo Night" },
	{ id: "catppuccin", name: "Catppuccin" },
	{ id: "gruvbox", name: "Gruvbox Dark" },
	{ id: "nord", name: "Nord" },
	{ id: "rosepine", name: "Rosé Pine" }
] as const

export type ThemeId = (typeof THEMES)[number]["id"]

export const DEFAULT_THEME: ThemeId = "tokyonight"
export const THEME_STORAGE_KEY = "nv-theme"
