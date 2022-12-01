/** Saves response to cache based on request.
  * Be sure to clone response and use ctx.waitUntil()
  */
export async function saveToCache(
	request: Request, response: Response, ctx: ExecutionContext
): Promise<void> {
	const cache = caches.default
	await cache.put(request, response)
}

export async function cacheAndServe(
	request: Request, response: Response, ctx: ExecutionContext): Promise<Response> {
	ctx.waitUntil(saveToCache(request, response.clone(), ctx))
	return response
}