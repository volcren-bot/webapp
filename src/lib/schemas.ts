import { z } from "zod"
import { CATEGORIES, MAX_PRICE, STAGES, TYPES } from "#lib/scripts"
import { formatCredits } from "#lib/utils"

// Kept out of #lib/scripts so pages that only list scripts don't ship zod.
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
			.max(MAX_PRICE, `Must be at most ${formatCredits(MAX_PRICE)} per minute (under €100 a month).`),
		stage: z.enum(STAGES),
		categories: z.array(z.enum(CATEGORIES)).max(5, "Pick at most 5 categories.")
	})
	.refine((s) => (s.type === "free") === (s.price === 0), {
		path: ["price"],
		message: `Free scripts cost nothing, premium scripts cost at least ${formatCredits(1)} per minute.`
	})
