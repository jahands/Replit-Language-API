import { Route, Request } from 'itty-router'

export type Meta = {
	timestamp: number
}

export interface Env {
	// Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
	// MY_KV_NAMESPACE: KVNamespace;
	//
	// Example binding to Durable Object. Learn more at https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
	// MY_DURABLE_OBJECT: DurableObjectNamespace;
	//
	// Example binding to R2. Learn more at https://developers.cloudflare.com/workers/runtime-apis/r2/
	// MY_BUCKET: R2Bucket;
	CACHE: KVNamespace
}

// Router
type MethodType =
    'GET' |
    'HEAD' |
    'POST' |
    'PUT' |
    'DELETE' |
    'PATCH' |
    'OPTIONS' |
    'TRACE' |
    'CONNECT'

export interface IRequest extends Request {
    method: MethodType // method is required to be on the interface
    url: string // url is required to be on the interface
    optional?: string
}

export interface IMethods {
    get: Route
    head: Route
    post: Route
    put: Route
    delete: Route
    patch: Route
    options: Route
    trace: Route
    connect: Route
}