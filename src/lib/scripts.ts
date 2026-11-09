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
import { CREDITS_PER_CENT, MINUTES_PER_MONTH } from "#lib/credits"
import { formatCredits } from "#lib/utils"
import { Constants, type Database } from "#lib/types/supabase"

export type ScriptCategory = Database["scripts"]["Enums"]["category"]
type ScriptStage = Database["scripts"]["Enums"]["stage"]
export type ScriptType = Database["scripts"]["Enums"]["type"]

export type Role = Database["profiles"]["Enums"]["roles"]

/** `profiles.roles`, lowest to highest. */
const ROLES: readonly Role[] = Constants.profiles.Enums.roles

export const roleAtLeast = (role: string | null | undefined, minimum: Role) => {
	const rank = ROLES.indexOf(role as Role)
	return rank >= 0 && rank >= ROLES.indexOf(minimum)
}

/** A script by someone below scripter is a community script (scripts.author_is_community). */
export const isCommunityRole = (role: string | null | undefined) => !roleAtLeast(role, "scripter")

/** Byte sizes as megabytes, e.g. "12.5". */
export const megabytes = (bytes: number, locale = "en-US") =>
	(bytes / 1024 / 1024).toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })

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

/** Credits per minute. 22 is €95.04 for 30 days of nonstop use (metadata_price_max_check). */
export const MAX_PRICE = 22

/** Prices are stored in credits per minute and read per hour: "0.06 CREDIT/h". */
export const formatPrice = (credits: number, locale?: string) =>
	credits === 0 ? "free" : `${formatCredits(credits * 60, locale)}/h`

/** What a price costs over 30 days of nonstop use, in EUR cents. */
export const monthlyCents = (credits: number) => (credits * MINUTES_PER_MONTH) / CREDITS_PER_CENT
