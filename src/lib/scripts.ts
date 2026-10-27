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
import { ENCRYPTION_OVERHEAD } from "#lib/encryption"
import { Constants, type Database } from "#lib/types/supabase"

export type ScriptCategory = Database["scripts"]["Enums"]["category"]
export type ScriptStage = Database["scripts"]["Enums"]["stage"]
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

/** Byte sizes of the community limits as megabytes, e.g. "12.5". */
export const megabytes = (bytes: number) => (bytes / 1024 / 1024).toFixed(1)

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

/** Credits per minute. 22 is about €98 for a 31-day month of nonstop use (metadata_price_max_check). */
export const MAX_PRICE = 22
export const MAX_FILES = 50
/** The scripts bucket allows 5 MB per object, and the encrypted file is a little larger than the plain one. */
export const MAX_FILE_BYTES = 5 * 1024 * 1024 - ENCRYPTION_OVERHEAD
const UPLOAD_CONCURRENCY = 6

/**
 * Runs `upload` over a revision's files a few at a time instead of one after another. After the first
 * error no new uploads start; it is thrown once the ones in flight settle, so the caller can discard the
 * revision without racing them.
 */
export async function uploadAll(files: File[], upload: (file: File) => Promise<void>) {
	const queue = [...files]
	const errors: unknown[] = []
	const worker = async () => {
		for (let file = queue.shift(); file && !errors.length; file = queue.shift()) {
			try {
				await upload(file)
			} catch (error) {
				errors.push(error)
			}
		}
	}
	await Promise.all(Array.from({ length: Math.min(UPLOAD_CONCURRENCY, files.length) }, worker))
	if (errors.length) throw errors[0]
}

/**
 * A file path inside a revision: letters, digits, _ . - and / between segments, no "." or ".."
 * segment, at most 200 characters. The database checks the same rules (scripts.valid_files).
 */
export const validFileName = (name: string) =>
	name.length <= 200 &&
	name.split("/").every((part) => /^[A-Za-z0-9_.-]+$/.test(part) && part !== "." && part !== "..")

/** Prices are in credits per minute. */
export const formatPrice = (credits: number, locale?: string) =>
	credits === 0 ? "free" : `${formatCredits(credits, locale)}/min`
