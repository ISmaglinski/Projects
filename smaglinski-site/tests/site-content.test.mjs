import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("uses a local-only Next.js runtime", async () => {
  const packageJson = JSON.parse(
    await readFile(new URL("package.json", root), "utf8"),
  );

  assert.match(packageJson.scripts.dev, /^next dev --hostname 127\.0\.0\.1$/);
  assert.equal(packageJson.scripts.build, "next build");
  assert.doesNotMatch(JSON.stringify(packageJson), /vinext|wrangler|cloudflare/i);
  await assert.rejects(access(new URL(".openai/hosting.json", root)));
});

test("home opens on an accessible brother-first tab interface", async () => {
  const home = await readFile(new URL("app/home-tabs.tsx", root), "utf8");

  assert.match(home, /role="tablist"/);
  assert.match(home, /aria-selected/);
  assert.match(home, /Ian, Jacob, and Isaac/);
  assert.match(home, /brother-card-grid/);
  assert.match(home, /FamilyChat/);
  assert.match(home, /See more from the brothers/);
  assert.match(home, /home-build-cta/);
  assert.match(home, /Escape/);
});

test("ships a local assistant preview with a future model API seam", async () => {
  const chat = await readFile(new URL("app/family-chat.tsx", root), "utf8");
  const route = await readFile(
    new URL("app/api/assistant/route.ts", root),
    "utf8",
  );

  assert.match(chat, /role="log"/);
  assert.match(chat, /custom model not connected yet/);
  assert.match(chat, /\/api\/assistant/);
  assert.match(route, /local-preview/);
  assert.match(route, /future model credentials/);
});

test("documents the AI machine and its NVIDIA-SMI evidence", async () => {
  const data = await readFile(new URL("app/site-data.ts", root), "utf8");

  assert.match(data, /4 x RTX 3090/);
  assert.match(data, /96 GB/);
  assert.match(data, /128 GB DDR4/);
  assert.match(data, /aggregate VRAM/);
  assert.match(data, /nvidia-smi\.png/);
  assert.match(data, /100% GPU utilization/);
});

test("adds Ian's verified Rocky team project and source link", async () => {
  const data = await readFile(new URL("app/site-data.ts", root), "utf8");
  const profile = await readFile(new URL("app/profile-tabs.tsx", root), "utf8");

  assert.match(data, /title: "Rocky"/);
  assert.match(data, /Canvas-inspired course platform/);
  assert.match(data, /roster and group management/);
  assert.match(data, /university LLM API keys/);
  assert.match(
    data,
    /https:\/\/github\.com\/Spring-2026-Software-Engineering\/Rocky/,
  );
  assert.match(profile, /project\.sourceUrl/);
  assert.match(profile, /View on GitHub/);
});

test("every brother profile exposes the same four tab choices", async () => {
  const profile = await readFile(new URL("app/profile-tabs.tsx", root), "utf8");

  for (const label of ["Overview", "Experience", "Selected work", "Background"]) {
    assert.match(profile, new RegExp(label));
  }

  assert.match(profile, /role="tabpanel"/);
  assert.match(profile, /PROFILE IN PROGRESS/);
});
