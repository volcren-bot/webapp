import { z } from "zod"
import type { Component } from "svelte"
import Swords from "@lucide/svelte/icons/swords"
import Skull from "@lucide/svelte/icons/skull"
import Gamepad2 from "@lucide/svelte/icons/gamepad-2"
import Coins from "@lucide/svelte/icons/coins"
import Wrench from "@lucide/svelte/icons/wrench"
import WandSparkles from "@lucide/svelte/icons/wand-sparkles"
import Sparkles from "@lucide/svelte/icons/sparkles"
import Pickaxe from "@lucide/svelte/icons/pickaxe"
import Fish from "@lucide/svelte/icons/fish"
import Axe from "@lucide/svelte/icons/axe"
import Crosshair from "@lucide/svelte/icons/crosshair"
import Sprout from "@lucide/svelte/icons/sprout"
import CookingPot from "@lucide/svelte/icons/cooking-pot"
import Hammer from "@lucide/svelte/icons/hammer"
import Flame from "@lucide/svelte/icons/flame"
import FlaskConical from "@lucide/svelte/icons/flask-conical"
import Gem from "@lucide/svelte/icons/gem"
import House from "@lucide/svelte/icons/house"
import Zap from "@lucide/svelte/icons/zap"
import Target from "@lucide/svelte/icons/target"
import Anvil from "@lucide/svelte/icons/anvil"
import Sailboat from "@lucide/svelte/icons/sailboat"
import { formatCredits } from "#lib/utils"
import { Constants, type Database } from "#lib/types/supabase"

export type ScriptCategory = Database["scripts"]["Enums"]["category"]
export type ScriptStage = Database["scripts"]["Enums"]["stage"]
export type ScriptType = Database["scripts"]["Enums"]["type"]

export const CATEGORIES = Constants.scripts.Enums.category
export const STAGES = Constants.scripts.Enums.stage
export const TYPES = Constants.scripts.Enums.type

export const CATEGORY_ICONS: Record<ScriptCategory, Component> = {
	combat: Swords,
	boss: Skull,
	minigame: Gamepad2,
	moneymaker: Coins,
	tool: Wrench,
	magic: WandSparkles,
	prayer: Sparkles,
	mining: Pickaxe,
	fishing: Fish,
	woodcutting: Axe,
	hunter: Crosshair,
	farming: Sprout,
	cooking: CookingPot,
	smithing: Anvil,
	fletching: Target,
	firemaking: Flame,
	herblore: FlaskConical,
	crafting: Hammer,
	construction: House,
	agility: Zap,
	slayer: Skull,
	thieving: Gem,
	runecrafting: Sparkles,
	sailing: Sailboat
}

export const STAGE_COLORS: Record<ScriptStage, string> = {
	prototype: "var(--tn-red)",
	alpha: "var(--tn-orange)",
	beta: "var(--tn-yellow)",
	stable: "var(--tn-green)",
	archived: "var(--tn-comment)"
}

export const MAX_PRICE = 10_000
export const MAX_FILES = 50
export const MAX_FILE_BYTES = 5 * 1024 * 1024

/** Prices are in credits per minute. */
export const formatPrice = (credits: number) => (credits === 0 ? "free" : `${formatCredits(credits)}/min`)

export const scriptSchema = z
	.object({
		title: z
			.string()
			.trim()
			.min(3, "Must be at least 3 characters long.")
			.max(80, "Must be at most 80 characters long."),
		description: z
			.string()
			.trim()
			.min(10, "Must be at least 10 characters long.")
			.max(200, "Must be at most 200 characters long."),
		content: z
			.string()
			.trim()
			.min(1, "Write something about the script.")
			.max(10_000, "Must be at most 10,000 characters long."),
		type: z.enum(TYPES),
		price: z
			.number("Must be a number.")
			.int("Must be a whole number of credits.")
			.min(0)
			.max(MAX_PRICE, `Must be at most ${formatCredits(MAX_PRICE)} per minute.`),
		stage: z.enum(STAGES),
		categories: z.array(z.enum(CATEGORIES)).max(5, "Pick at most 5 categories.")
	})
	.refine((s) => (s.type === "free") === (s.price === 0), {
		path: ["price"],
		message: `Free scripts cost nothing, premium scripts cost at least ${formatCredits(1)} per minute.`
	})
