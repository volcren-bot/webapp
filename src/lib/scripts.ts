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
import { MICROCREDITS_PER_CREDIT, MINUTES_PER_MONTH } from "#lib/credits"
import { DEFAULT_LOCALE, formatCredits } from "#lib/utils"
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

/** Microcredits per hour. 134,400 is €99.99 for 31 days of nonstop use (metadata_price_max_check). */
export const MAX_PRICE = 134_400
const PRICE_DECIMALS = 6

/** Prices are stored in microcredits per hour: "0.07 CREDIT/h". */
export const formatPrice = (price: number, locale?: string) =>
	price === 0 ? "free" : `${formatCredits(price, locale)}/h`

export const pricePerDay = (price: number) => price * 24

/** What a price costs over 30 days of nonstop use, in microcredits. */
export const pricePerMonth = (price: number) => (price * MINUTES_PER_MONTH) / 60

const decimalSeparator = (locale: string) =>
	new Intl.NumberFormat(locale).formatToParts(1.5).find((part) => part.type === "decimal")?.value ?? "."

/** A price as an author types it: "0,07" in a comma locale, and "0," for no price yet. */
export const formatPriceInput = (price: number, locale = DEFAULT_LOCALE) =>
	price === 0
		? `0${decimalSeparator(locale)}`
		: (price / MICROCREDITS_PER_CREDIT).toLocaleString(locale, {
				useGrouping: false,
				maximumFractionDigits: PRICE_DECIMALS
			})

/** Reads a typed price in CREDIT per hour, with either decimal separator, into microcredits per hour. */
export function parsePrice(raw: string, locale = DEFAULT_LOCALE): { price: number } | { error: string } {
	const match = /^(\d{1,3})(?:[.,](\d*))?$/.exec(raw.trim())
	if (!match) return { error: `Type the price in CREDIT per hour, like 0${decimalSeparator(locale)}05.` }
	const [, whole, fraction = ""] = match
	if (fraction.length > PRICE_DECIMALS) return { error: `Use at most ${PRICE_DECIMALS} decimals.` }
	const price = Number(whole) * MICROCREDITS_PER_CREDIT + Number(fraction.padEnd(PRICE_DECIMALS, "0"))
	if (price === 0) return { error: "A premium script needs a price above 0." }
	if (price > MAX_PRICE) return { error: `The highest price is ${formatPrice(MAX_PRICE, locale)}.` }
	return { price }
}
