import assert from "node:assert/strict";
import test from "node:test";

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set(
    "test",
    `${process.pid}-${Date.now()}-${path.replaceAll("/", "-")}`,
  );
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${path}`, {
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

test("server-renders the finished family portfolio", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /Three brothers/);
  assert.match(html, /One instinct/);
  assert.match(html, /Built together/i);
  assert.match(html, /Ian/);
  assert.match(html, /Jacob/);
  assert.match(html, /Isaac/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton|taking shape/i);
});

test("server-renders resume-derived profile routes", async () => {
  const [ianResponse, jacobResponse, isaacResponse] = await Promise.all([
    render("/ian"),
    render("/jacob"),
    render("/isaac"),
  ]);

  assert.equal(ianResponse.status, 200);
  assert.equal(jacobResponse.status, 200);
  assert.equal(isaacResponse.status, 200);

  const [ian, jacob, isaac] = await Promise.all([
    ianResponse.text(),
    jacobResponse.text(),
    isaacResponse.text(),
  ]);

  assert.match(ian, /SQL to Power BI Analytics/);
  assert.match(ian, /Kent State University/);
  assert.match(jacob, /Lucet Health/);
  assert.match(jacob, /Healthcare Guidelines AI Assistant/);
  assert.match(isaac, /Ready for Isaac/);
  assert.match(isaac, /Content pending/);
});
