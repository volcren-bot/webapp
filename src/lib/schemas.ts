import { z } from "zod"

export const profileSchema = z.object({
	email: z.string().email("Must be a valid email!").optional(),
	password: z
		.string()
		.min(6, "Must be more than 6 characters long.")
		.max(32, "Must be less than 32 characters long.")
		.optional()
})
