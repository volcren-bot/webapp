export const REPO_URL = "https://github.com/volcren-bot/webapp"

export const FAQ_DIR = "src/routes/(nav)/information/faq"

/** GitHub's web editor for a file on the main branch; it forks and opens a pull request for people without write access. */
export const editUrl = (path: string) => `${REPO_URL}/edit/main/${path}`

const NEW_FAQ_TEMPLATE = `<script lang="ts" module>
	export const question = "Your question?"
	export const order = 99
</script>

<script lang="ts">
	import FaqAnswer from "#lib/components/FaqAnswer.svelte"
</script>

<FaqAnswer {question}>
	Your answer.
</FaqAnswer>
`

/** GitHub's new-file editor, prefilled with a FAQ page. The folder name is the URL, so people only rename it. */
export const newFaqUrl = () =>
	`${REPO_URL}/new/main/${FAQ_DIR}?${new URLSearchParams({
		filename: "your-question-slug/+page.svelte",
		value: NEW_FAQ_TEMPLATE
	})}`
