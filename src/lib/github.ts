const REPO_URL = "https://github.com/volcren-bot/webapp"

export const DOCS_URL = "https://docs.volcren.com"

export const FAQ_DIR = "src/routes/(nav)/information/faq"
export const TUTORIAL_DIR = "src/routes/(nav)/tutorials"

/** GitHub's web editor for the page at `pathname`, whose route folder under `dir` is its last segment; it forks and opens a pull request for people without write access. */
export const editPageUrl = (dir: string, pathname: string) =>
	`${REPO_URL}/edit/main/${dir}/${pathname.split("/").at(-1)}/+page.svelte`

/** GitHub's new-file editor, prefilled with a page. The folder name is the URL, so people only rename it. */
const newPageUrl = (dir: string, slug: string, template: string) =>
	`${REPO_URL}/new/main/${dir}?${new URLSearchParams({ filename: `${slug}/+page.svelte`, value: template })}`

export const NEW_FAQ_URL = newPageUrl(
	FAQ_DIR,
	"your-question-slug",
	`<script lang="ts" module>
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
)

export const NEW_TUTORIAL_URL = newPageUrl(
	TUTORIAL_DIR,
	"your-tutorial-slug",
	`<script lang="ts" module>
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
)
