const CACHE_NAME = "role-radar-v1";
const CORE_ASSETS = ["/", "./favicon.svg", "./og.png", "./data/current.json"];

const canCache = (response) => response.ok && response.type !== "opaque";

const isValidJsonResponse = async (response) => {
  if (!canCache(response)) return false;
  try {
    const value = await response.json();
    return (
      value !== null &&
      typeof value === "object" &&
      typeof value.snapshotAt === "string" &&
      Array.isArray(value.jobs)
    );
  } catch {
    return false;
  }
};

const networkFirst = async (request, { validateJson = false, fallbackRequest } = {}) => {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    const valid = validateJson
      ? await isValidJsonResponse(response.clone())
      : canCache(response);
    if (valid) {
      await cache.put(request, response.clone());
      return response;
    }
    return (await cache.match(request)) ??
      (fallbackRequest ? await cache.match(fallbackRequest) : undefined) ??
      response;
  } catch {
    const cached =
      (await cache.match(request)) ??
      (fallbackRequest ? await cache.match(fallbackRequest) : undefined);
    if (cached) return cached;
    throw new Error("RoleRadar is offline and no last-good response is cached.");
  }
};

const cacheFirst = async (request) => {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (canCache(response)) await cache.put(request, response.clone());
  return response;
};

const isCurrentData = (url) => url.pathname.endsWith("/data/current.json");
const isHashedAsset = (url) => /\/assets\/[^/]+-[A-Za-z0-9_-]{8,}\.(?:js|css)$/.test(url.pathname);
const isCoreAsset = (url) =>
  url.pathname.endsWith("/favicon.svg") || url.pathname.endsWith("/og.png");
const isDevelopmentAsset = (url) =>
  url.pathname.startsWith("/src/") ||
  url.pathname.startsWith("/@vite/") ||
  url.pathname.startsWith("/@fs/") ||
  url.pathname.startsWith("/node_modules/.vite/") ||
  url.pathname.startsWith("/node_modules/vite/") ||
  url.pathname === "/@react-refresh" ||
  url.searchParams.has("import");

const assetReferences = (text, contentType) => {
  const references = new Set();
  if (contentType.includes("text/html")) {
    for (const match of text.matchAll(/\b(?:src|href)=["']([^"']+)["']/gi)) {
      references.add(match[1]);
    }
  }
  if (contentType.includes("javascript") || contentType.includes("typescript")) {
    const imports = /(?:^|\n)\s*(?:import|export)\s+(?:[^"'\n]*?\s+from\s+)?["']([^"']+)["']/g;
    for (const match of text.matchAll(imports)) references.add(match[1]);
  }
  return [...references];
};

const precacheResourceGraph = async (input, cache, visited) => {
  if (typeof input === "string" && !/^(?:\/|\.{1,2}\/|https?:\/\/)/.test(input)) return;
  const url = new URL(input, self.registration.scope);
  if (url.origin !== self.location.origin || visited.has(url.href)) return;
  visited.add(url.href);
  try {
    const request = new Request(url.href, { cache: "reload" });
    const response = await fetch(request);
    const valid = url.pathname.endsWith(".json")
      ? await isValidJsonResponse(response.clone())
      : canCache(response);
    if (!valid) return;
    await cache.put(request, response.clone());
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html") && !contentType.includes("javascript") && !contentType.includes("typescript")) return;
    const text = await response.text();
    for (const reference of assetReferences(text, contentType)) {
      if (!/^(?:\/|\.{1,2}\/|https?:\/\/)/.test(reference)) continue;
      await precacheResourceGraph(reference.startsWith("http") ? reference : new URL(reference, url).href, cache, visited);
    }
  } catch {
    // A single optional asset must not prevent the last-good shell from installing.
  }
};

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      const visited = new Set();
      for (const asset of ["./", ...CORE_ASSETS]) {
        await precacheResourceGraph(asset, cache, visited);
      }
      await self.skipWaiting();
    }),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      networkFirst(request, { fallbackRequest: new URL("./", self.registration.scope).href }),
    );
    return;
  }
  if (isCurrentData(url)) {
    event.respondWith(networkFirst(request, { validateJson: true }));
    return;
  }
  if (isHashedAsset(url)) {
    event.respondWith(cacheFirst(request));
    return;
  }
  if (isCoreAsset(url)) {
    event.respondWith(cacheFirst(request));
    return;
  }
  if (isDevelopmentAsset(url)) {
    event.respondWith(networkFirst(request));
  }
});
