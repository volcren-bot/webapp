import { error } from "@sveltejs/kit"
import { faqs } from "#lib/faqs"

export function load({ params }) {
	const faq = faqs.find((f) => f.id === params.id)
	if (!faq) error(404, "Question not found")
	return { faq }
}
