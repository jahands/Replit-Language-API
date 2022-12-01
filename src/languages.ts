import { Env, Meta } from "./types"

export async function getLanguagesLive(): Promise<any | null> {
	const langUrl = 'https://replit.com/languages'
	const response = await fetch(langUrl)
	if (!response.ok) {
		return null
	}
	// const htmlText = await response.text();

	const rewriter = new HTMLRewriter()

	const selector = 'script'
	let script = ''
	let foundEnd = false
	let foundStart = false
	const startPrefix = `JSON.parse(atob('`
	const endPrefix = `'))`
	rewriter.on(selector, {
		// element(element) {},
		text(text) {
			if (
				text.text.includes(startPrefix) &&
				text.text.includes('KNOWN_LANGUAGES')
			) {
				foundStart = true
			}
			if (foundStart && !foundEnd) {
				script += text.text.trim()
				if (text.text.includes("'))")) {
					foundEnd = true
				}
			}
		},
	})
	const transformed = rewriter.transform(response)
	await transformed.text()
	const startIndex = script.indexOf(startPrefix) + startPrefix.length
	const endIndex = script.indexOf(endPrefix)
	const languagesBase64 = script.substring(startIndex, endIndex)
	const languages = JSON.parse(atob(languagesBase64))
	return languages
}

export async function getLanguagesCached(
	env: Env,
	ctx: ExecutionContext
): Promise<any | null> {
	const key = 'x:languages_cached'
	const { value, metadata } = await env.CACHE.getWithMetadata(key, 'json')
	if (value) {
		const timestamp = (metadata as Meta).timestamp
		// Try to refresh once a day
		if (Date.now() - timestamp < 60 * 60 * 24 * 1000) {
			return value
		} else {
			// Try to get live value
			try {
				const languages = await getLanguagesLive()
				if (languages) {
					ctx.waitUntil(
						env.CACHE.put(key, JSON.stringify(languages), {
							metadata: { timestamp: Date.now() },
						})
					)
					return languages
				} else {
					return value // Use cached value, better luck next time
				}
			} catch {
				return value // Use cached value, better luck next time
			}
		}
	} else {
		const languages = await getLanguagesLive()
		if (languages) {
			ctx.waitUntil(
				env.CACHE.put(key, JSON.stringify(languages), {
					metadata: { timestamp: Date.now() },
				})
			)
			return languages
		} else {
			return null
		}
	}
}