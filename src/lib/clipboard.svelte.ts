/** Copies text and keeps it as `copied` for `ms`, so a button can say so; a refused clipboard copies nothing. */
export function clipboard(ms = 2000) {
	let copied = $state<string | null>(null)
	let timer: ReturnType<typeof setTimeout>
	return {
		get copied() {
			return copied
		},
		async copy(text: string) {
			try {
				await navigator.clipboard.writeText(text)
			} catch {
				return
			}
			copied = text
			clearTimeout(timer)
			timer = setTimeout(() => (copied = null), ms)
		}
	}
}
