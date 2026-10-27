/**
 * Fixed-window counter per key, in this process. Returns false once a key goes over `max` hits within
 * `duration` ms. It only keeps one server from being hammered; the database holds the limits that matter.
 */
export function createLimiter(max: number, duration: number) {
	const hits = new Map<string, { count: number; reset: number }>()

	setInterval(() => {
		const now = Date.now()
		for (const [key, entry] of hits) if (entry.reset <= now) hits.delete(key)
	}, duration).unref()

	return (key: string) => {
		const now = Date.now()
		const entry = hits.get(key)
		if (!entry || entry.reset <= now) {
			hits.set(key, { count: 1, reset: now + duration })
			return true
		}
		return ++entry.count <= max
	}
}
