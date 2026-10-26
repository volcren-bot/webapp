export const REPO_URL = "https://github.com/volcren-bot/webapp"

export const DOCS_URL = "https://docs.volcren.com"

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

export const TUTORIAL_DIR = "src/routes/(nav)/tutorials"

const NEW_TUTORIAL_TEMPLATE = `<script lang="ts" module>
	export const title = "Your tutorial title"
	export const description = "One sentence on what this tutorial covers."
	export const order = 99
</script>

<script lang="ts">
	import TutorialPage from "#lib/components/TutorialPage.svelte"
</script>

<TutorialPage {title}>
	Your tutorial.
</TutorialPage>
`

/** GitHub's new-file editor, prefilled with a tutorial page. The folder name is the URL, so people only rename it. */
export const newTutorialUrl = () =>
	`${REPO_URL}/new/main/${TUTORIAL_DIR}?${new URLSearchParams({
		filename: "your-tutorial-slug/+page.svelte",
		value: NEW_TUTORIAL_TEMPLATE
	})}`
