import { listKey } from "./shortcuts.svelte.js"

export const faqs = [
	{
		q: "What is this?",
		a: "It is a tool that lets you run scripts that play the game for you, handling repetitive tasks so you don't have to."
	},
	{
		q: "How does it work?",
		a: "It runs alongside your game client and reads what is happening in the game, such as your items, skills and surroundings. It then sends mouse and keyboard input back, just like you would."
	},
	{
		q: "Which operating systems are supported?",
		a: "Windows, and Linux if you run the game client through Wine. macOS is not supported at the moment."
	},
	{
		q: "Does it take over my computer?",
		a: "No. It only talks to the game client you choose. The rest of your computer is left alone."
	},
	{
		q: "Do I need to know how to code?",
		a: "No. You just pick a script, press start and let it run. If you do like to code, you can write your own scripts too."
	},
	{
		q: "What are scripts written in?",
		a: "Scripts are written in Luau, a small and friendly language that is easy to pick up."
	},
	{
		q: "Can I run more than one game client at once?",
		a: "Yes. Each game client is handled on its own, so you can pick which one a script should control."
	},
	{
		q: "Can I stop a script at any time?",
		a: "Yes. You can stop a script whenever you like from the app, and you are always in control."
	}
].map((f, i) => ({ ...f, id: String(i), key: listKey(i) }))
