import { Router } from 'itty-router'
import { getLanguagesCached } from "./languages"
import { cacheAndServe } from './cache'

import { Env, IRequest, IMethods } from "./types"

const defaultCacheHeaders = {
	'Cache-Control': 'public, max-age=3600',
	'Cloudflare-CDN-Cache-Control': 'public, max-age=86400',
}

const router = Router<IRequest, IMethods>()
	.get('*', serveFromCache)
	.get('/ping', servePingPong)
	.get('/api/languages', serveLanguages)
	.get('/api/languages/keys', serveLanguageKeys)
	.options('*', serveOptions)
	.all('*', () => new Response(null, { status: 400 }))
	.catch('*', () => new Response('internal error', { status: 500 }))

export default {
	fetch: router.handle
}

/** Middleware: Try to serve request from CF cache */
async function serveFromCache(request: Request): Promise<Response | void> {
	const cache = caches.default
	const cachedResponse = await cache.match(request)
	if (cachedResponse) {
		return cachedResponse
	}
}

async function serveOptions(): Promise<Response | void> {
	return new Response('ok', {
		headers: {
			'Access-Control-Request-Method': 'GET',
			'Access-Control-Allow-Origin': '*'
		}
	})
}

/** Test endpoint */
async function servePingPong(
	request: Request, _env: Env, ctx: ExecutionContext
): Promise<Response | void> {
	const response = Response.json(
		{ message: 'pong' },
		{
			headers: {
				'Cache-Control': 'public, max-age=5',
				'Cloudflare-CDN-Cache-Control': 'public, max-age=5',
			},
		}
	)
	return cacheAndServe(request, response, ctx)
}

async function serveLanguages(
	request: Request, env: Env, ctx: ExecutionContext
): Promise<Response | void> {
	const languages = await getLanguagesCached(env, ctx)
	const response = Response.json(
		{
			api_version: 1,
			languages: languages,
		},
		{ headers: defaultCacheHeaders }
	)
	return cacheAndServe(request, response, ctx)
}

async function serveLanguageKeys(
	request: Request, env: Env, ctx: ExecutionContext
): Promise<Response | void> {
	const languages = await getLanguagesCached(env, ctx)
	const response = Response.json(
		{
			api_version: 1,
			language_keys: Object.entries(languages).map(([key, _]) => key),
		},
		{ headers: defaultCacheHeaders }
	)
	return cacheAndServe(request, response, ctx)
}
