/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `wrangler dev src/index.ts` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `wrangler publish src/index.ts --name my-worker` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export interface Env {
  // Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
  // MY_KV_NAMESPACE: KVNamespace;
  //
  // Example binding to Durable Object. Learn more at https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
  // MY_DURABLE_OBJECT: DurableObjectNamespace;
  //
  // Example binding to R2. Learn more at https://developers.cloudflare.com/workers/runtime-apis/r2/
  // MY_BUCKET: R2Bucket;
  CACHE: KVNamespace;
}

const defaultCacheHeaders = {
  "Cache-Control": "public, max-age=3600",
  "Cloudflare-CDN-Cache-Control": "public, max-age=86400",
};

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    // Check cache first
    const cache = caches.default;
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    let response;
    const url = new URL(request.url);
    if (url.pathname === "/ping") {
      response = Response.json(
        { message: "pong" },
        {
          headers: {
            "Cache-Control": "public, max-age=5",
            "Cloudflare-CDN-Cache-Control": "public, max-age=5",
          },
        }
      );
    } else if (url.pathname === "/api/languages") {
      const languages = await getLanguagesCached(env, ctx);

      response = Response.json(
        {
          api_version: 1,
          languages: languages,
        },
        { headers: defaultCacheHeaders }
      );
    } else if (url.pathname === "/api/languages/keys") {
      const languages = await getLanguagesCached(env, ctx);

      response = Response.json(
        {
          api_version: 1,
          language_keys: Object.entries(languages).map(([key, _]) => key),
        },
        { headers: defaultCacheHeaders }
      );
    }

    if (response) {
      // Write to CF Cache
      ctx.waitUntil(cache.put(request, response.clone()));
    } else {
      response = new Response(null, { status: 404 });
    }

    return response;
  },
};

async function getLanguagesLive(): Promise<any | null> {
  const langUrl = "https://replit.com/languages";
  const response = await fetch(langUrl);
  if (!response.ok) {
    return null;
  }
  // const htmlText = await response.text();

  const rewriter = new HTMLRewriter();

  const selector = "script";
  let script = "";
  let foundEnd = false;
  let foundStart = false;
  rewriter.on(selector, {
    // element(element) {},

    text(text) {
      if (text.text.includes("KNOWN_LANGUAGES")) {
        foundStart = true;
      }
      if (foundStart && !foundEnd) {
        script += text.text.trim();
        if (text.text.includes("'))")) {
          foundEnd = true;
        }
      }
    },
  });
  const transformed = rewriter.transform(response);
  await transformed.text();
  const startPrefix = `JSON.parse(atob('`;
  const endPrefix = `'))`;
  const startIndex = script.indexOf(startPrefix) + startPrefix.length;
  const endIndex = script.indexOf(endPrefix);
  const languagesBase64 = script.substring(startIndex, endIndex);
  const languages = JSON.parse(atob(languagesBase64));
  return languages;
}

type Meta = {
  timestamp: number;
};
async function getLanguagesCached(
  env: Env,
  ctx: ExecutionContext
): Promise<any | null> {
  const key = "x:languages_cached";
  const { value, metadata } = await env.CACHE.getWithMetadata(key, "json");
  if (value) {
    const timestamp = (metadata as Meta).timestamp;
    const now = Date.now();
    if (now - timestamp < 60 * 60 * 24 * 1000) {
      // 1 day
      return value;
    } else {
      // Try to get live value
      try {
        const languages = await getLanguagesLive();
        if (languages) {
          ctx.waitUntil(
            env.CACHE.put(key, JSON.stringify(languages), {
              metadata: { timestamp: Date.now() },
            })
          );
          return languages;
        } else {
          return value; // Use cached value, better luck next time
        }
      } catch {
        return value; // Use cached value, better luck next time
      }
    }
  } else {
    const languages = await getLanguagesLive();
    if (languages) {
      ctx.waitUntil(
        env.CACHE.put(key, JSON.stringify(languages), {
          metadata: { timestamp: Date.now() },
        })
      );
      return languages;
    } else {
      return null;
    }
  }
}
