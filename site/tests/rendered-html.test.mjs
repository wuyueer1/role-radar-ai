import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const templateRoot = new URL("../", import.meta.url);

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the CareerGraph AI decision workspace", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>CareerGraph AI \| 职业跃迁智能实验室<\/title>/i);
  assert.match(
    html,
    /property="og:image" content="http:\/\/localhost(?::3000)?\/og\.png"/i,
  );
  assert.match(
    html,
    /name="twitter:card" content="summary_large_image"/i,
  );
  assert.match(html, /看见、比较并质疑 AI 的职业决策依据/);
  assert.match(html, /稳定演示/);
  assert.match(html, /aria-label="候选人画像与偏好"/);
  assert.match(html, /aria-label="职业跃迁图谱"/);
  assert.match(html, /aria-label="路径比较"/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton|Your site is taking shape/i);
});

test("removes all disposable starter-preview infrastructure", async () => {
  const [page, layout, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(page, /CareerGraphApp/);
  assert.match(layout, /lang="zh-CN"/);
  assert.match(layout, /CareerGraph AI/);
  assert.doesNotMatch(page, /SkeletonPreview|codex-preview/);
  assert.doesNotMatch(layout, /Starter Project|next\/font\/google/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  await assert.rejects(access(new URL("../app/_sites-preview", templateRoot)));
});

test("uses only the supported public npm registry in the lockfile", async () => {
  const packageLock = JSON.parse(
    await readFile(new URL("../package-lock.json", import.meta.url), "utf8"),
  );
  const unsupported = Object.entries(packageLock.packages)
    .map(([name, value]) => ({ name, resolved: value.resolved }))
    .filter(({ resolved }) => {
      if (!resolved) return false;
      return new URL(resolved).hostname !== "registry.npmjs.org";
    });

  assert.deepEqual(unsupported, []);
});

test("registers an offline-safe service worker for interview reloads", async () => {
  const [appSource, serviceWorker] = await Promise.all([
    readFile(new URL("../app/CareerGraphApp.tsx", import.meta.url), "utf8"),
    readFile(new URL("../public/sw.js", import.meta.url), "utf8"),
  ]);

  assert.match(appSource, /serviceWorker\.register\("\/sw\.js"\)/);
  assert.match(serviceWorker, /addEventListener\("fetch"/);
  assert.match(serviceWorker, /request\.mode === "navigate"/);
  assert.match(serviceWorker, /caches\.match\("\/"\)/);
});
