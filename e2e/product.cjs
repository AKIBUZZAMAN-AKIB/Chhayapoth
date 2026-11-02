const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const assert = require("node:assert/strict");
(async () => {
  const b = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
  const p = await b.newPage({
    viewport: { width: 1440, height: 1000 },
    acceptDownloads: true,
  });
  const errors = [];
  p.on("pageerror", (e) => errors.push(e.message));
  await p.goto(process.env.APP_URL || "http://127.0.0.1:3001");
  await p.waitForFunction(() => !!document.querySelector(".ai-card"));
  await p.evaluate(async () => {
    let d = ChhayapothDomain.domain;
    await d.restore({ format: "chhayapoth-backup", version: 1, records: [] });
  });
  await p.evaluate(() => go("ledger"));
  await p.getByRole("button", { name: "নতুন এন্ট্রি" }).click();
  await p.locator("input[name=title]").fill("বাজার");
  await p.locator("input[name=amount]").fill("450.05");
  await p.getByRole("button", { name: "সংরক্ষণ করুন", exact: true }).click();
  await p.waitForFunction(
    async () => (await ChhayapothDomain.domain.list("ledger")).length === 1,
  );
  assert.equal(
    await p.evaluate(
      async () => (await ChhayapothDomain.domain.list("ledger"))[0].amountMinor,
    ),
    45005,
  );
  await p.reload();
  await p.waitForSelector("#ledgerView");
  assert.equal(
    await p.evaluate(
      async () => (await ChhayapothDomain.domain.list("ledger")).length,
    ),
    1,
  );
  await p.evaluate(() => go("habits"));
  await p.getByRole("button", { name: "নতুন অভ্যাস", exact: true }).click();
  await p.locator("input[name=title]").fill("পড়াশোনা");
  await p.getByRole("button", { name: "সংরক্ষণ করুন", exact: true }).click();
  await p.locator(".check").click();
  await p.waitForFunction(
    async () =>
      (await ChhayapothDomain.domain.list("habit"))[0].logs.length === 1,
  );
  await p.evaluate(() => go("calendar"));
  await p.getByRole("button", { name: "নতুন পরিকল্পনা", exact: true }).click();
  await p.locator("input[name=title]").fill("গণিত revision");
  await p.getByRole("button", { name: "সংরক্ষণ করুন", exact: true }).click();
  await p.waitForFunction(
    async () => (await ChhayapothDomain.domain.list("event")).length === 1,
  );
  await p.evaluate(() => go("store"));
  await p.getByRole("button", { name: "ড্যাশবোর্ডে যোগ করুন" }).last().click();
  await p.waitForFunction(() => !!document.querySelector(".focus-time"));
  await p.getByRole("button", { name: "২৫ মিনিট শুরু", exact: true }).click();
  assert(
    await p
      .locator("#focusClock")
      .innerText()
      .then((t) => t.startsWith("2")),
  );
  await p.evaluate(() => go("learn"));
  await p.locator("input[name=q1]").fill("9");
  await p.locator("input[name=q2]").fill("2");
  await p.locator("input[name=q3]").fill("0");
  await p.getByRole("button", { name: "উত্তর যাচাই করুন" }).click();
  await p.waitForSelector("#quizResult .notice");
  assert((await p.locator("#quizResult").innerText()).includes("3/3"));
  await p.evaluate(async () => {
    await ChhayapothDomain.domain.create("note", {
      title: "<img src=x onerror=alert(1)>",
      body: "<script>bad()</script>",
    });
    await go("notes");
  });
  assert.equal(await p.locator("#content img").count(), 0);
  assert.equal(await p.locator("#content script").count(), 0);
  await p.evaluate(() => go("messages"));
  await p.getByRole("button", { name: "খুঁজুন", exact: true }).click();
  await p.waitForFunction(() =>
    document.getElementById("toast").textContent.includes("native"),
  );
  assert.equal(await p.locator("#peers .rowitem").count(), 0);
  // Controlled provider response verifies source/timestamp rendering without a live-data claim.
  await p.route("https://api.open-meteo.com/**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        current: {
          temperature_2m: 28,
          wind_speed_10m: 5,
          time: "2026-11-02T12:00",
        },
      }),
    }),
  );
  await p.evaluate(() => go("weather"));
  await p.getByRole("button", { name: "আবহাওয়া আপডেট করুন" }).click();
  await p.waitForSelector(".weather-stat");
  assert.equal(await p.locator(".weather-stat").innerText(), "28°C");
  // Backup validation is non-destructive when malformed.
  const count = await p.evaluate(
    async () => (await ChhayapothDomain.domain.list()).length,
  );
  await p.evaluate(async () => {
    try {
      await ChhayapothDomain.domain.restore({ format: "bad" });
    } catch {}
  });
  assert.equal(
    await p.evaluate(async () => (await ChhayapothDomain.domain.list()).length),
    count,
  );
  for (const width of [1440, 768, 390, 360]) {
    await p.setViewportSize({ width, height: 900 });
    for (const route of [
      "home",
      "agent",
      "calendar",
      "more",
      "habits",
      "ledger",
      "learn",
      "care",
      "weather",
      "messages",
      "apps",
      "store",
      "notes",
      "settings",
    ]) {
      await p.evaluate((route) => go(route), route);
      await p.waitForTimeout(30);
      assert(
        !(await p.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        )),
        `${route} overflow at ${width}`,
      );
    }
  }
  await p.setViewportSize({ width: 1440, height: 1000 });
  await p.evaluate(() => go("home"));
  await p.waitForTimeout(250);
  await p.screenshot({
    path: "/home/user/chhayapoth-desktop.png",
    fullPage: true,
  });
  await p.setViewportSize({ width: 390, height: 844 });
  await p.screenshot({
    path: "/home/user/chhayapoth-mobile.png",
    fullPage: true,
  });
  assert.deepEqual(errors, []);
  console.log(
    "PASS: persistent CRUD; habit check; calendar; widget + timer; numerical quiz; HTML escaping; web Nearby fail-closed; weather renderer with mocked response; malformed restore protection; 56 route/viewport checks; no page errors.",
  );
  await b.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
