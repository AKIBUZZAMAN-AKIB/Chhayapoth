/* npm install --no-save playwright axe-core; install Chromium before running.
 * Existing tooling can be supplied with PLAYWRIGHT_MODULE / AXE_MODULE.
 * Fresh browser context only: no real-user records are changed.
 */
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox"],
  });
  const p = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  p.on("pageerror", (e) => errors.push(e.message));
  await p.goto(process.env.APP_URL || "http://127.0.0.1:3001");
  await p.waitForSelector(".dashboard-welcome");
  await p.evaluate(async () => {
    await ChhayapothDomain.domain.restore({
      format: "chhayapoth-backup",
      version: 1,
      records: [],
    });
    await go("ledger");
  });
  await p.getByRole("button", { name: "নতুন এন্ট্রি", exact: true }).click();
  await p.locator("[name=title]").fill("বাজারের খরচ");
  await p.locator("[name=amount]").fill("১২৩.৪৫");
  await p.getByRole("button", { name: "সংরক্ষণ করুন", exact: true }).click();
  await p.waitForFunction(
    async () => (await ChhayapothDomain.domain.list("ledger")).length === 1,
  );
  assert.equal(
    await p.evaluate(
      async () => (await ChhayapothDomain.domain.list("ledger"))[0].amountMinor,
    ),
    12345,
  );
  await p.evaluate(async () => {
    const old = new Date();
    old.setDate(1);
    old.setMonth(old.getMonth() - 1);
    const previous = `${old.getFullYear()}-${String(old.getMonth() + 1).padStart(2, "0")}-01`;
    await ChhayapothDomain.domain.create("ledger", {
      title: "নথিভুক্ত আয়",
      type: "income",
      category: "বেতন",
      amountMinor: 20000,
      date: today(),
    });
    await ChhayapothDomain.domain.create("ledger", {
      title: "আগের মাসের খরচ",
      type: "expense",
      category: "যাতায়াত",
      amountMinor: 99900,
      date: previous,
    });
    await go("ledger");
  });
  assert.equal(await p.locator("#ledgerView .rowitem").count(), 3);
  await p.locator("#ledgerType").selectOption("expense");
  assert.equal(await p.locator("#ledgerView .rowitem").count(), 2);
  await p.locator("#ledgerPeriod").selectOption("today");
  assert.equal(await p.locator("#ledgerView .rowitem").count(), 1);
  assert.equal(
    await p.locator("#ledgerView .metric.expense>strong").innerText(),
    "১২৩.৪৫৳",
  );
  await p.locator("#ledgerQuery").fill("কোনো মিল নেই");
  assert.equal(await p.locator("#ledgerView .rowitem").count(), 0);
  await p.locator("#ledgerQuery").fill("বাজার");
  assert.equal(await p.locator("#ledgerView .rowitem").count(), 1);
  await p.evaluate(() => window.dispatchEvent(new Event("focus")));
  assert.equal(await p.locator("#ledgerQuery").inputValue(), "বাজার");
  await p.evaluate(() => go("home"));
  assert.deepEqual(
    await p.locator(".dashboard-stats .metric>strong").allTextContents(),
    ["২০০.০০৳", "১২৩.৪৫৳", "৭৬.৫৫৳", "০ / ০"],
  );
  await p.locator(".chart-details summary").click();
  const totals = await p.evaluate(() =>
    [...document.querySelectorAll(".chart-details tbody td")].map(
      (e) => e.textContent,
    ),
  );
  assert(totals.includes("২০০.০০৳") && totals.includes("১২৩.৪৫৳"));
  const big = await p.evaluate(() => ({
    sum: sumMinor([
      { amountMinor: 9007199254740991 },
      { amountMinor: 2 },
    ]).toString(),
    negative: money(-1n),
    huge: money(900719925474099301n),
  }));
  assert.equal(big.sum, "9007199254740993");
  assert.equal(big.negative, "−০.০১৳");
  assert.equal(
    big.huge,
    new Intl.NumberFormat("bn-BD", { maximumFractionDigits: 0 }).format(
      9007199254740993n,
    ) + ".০১৳",
  );
  await p.evaluate(async () => {
    await ChhayapothDomain.domain.create("note", {
      title: "<img src=x onerror=alert(1)>",
      body: "ব্যক্তিগত নোট",
    });
    await go("notes");
  });
  await p.getByRole("button", { name: "নতুন নোট", exact: true }).click();
  await p.locator("[name=title]").fill("অসম্পূর্ণ নোট");
  await p.evaluate(() => window.dispatchEvent(new Event("focus")));
  assert.equal(await p.locator("[name=title]").inputValue(), "অসম্পূর্ণ নোট");
  await p.locator("#modal form button").focus();
  await p.keyboard.press("Tab");
  assert(
    await p.evaluate(() => !!document.activeElement.closest("[role=dialog]")),
  );
  await p.keyboard.press("Shift+Tab");
  assert(
    await p.evaluate(() => !!document.activeElement.closest("[role=dialog]")),
  );
  await p.keyboard.press("Escape");
  assert.equal(
    await p.evaluate(() => document.activeElement.textContent),
    "নতুন নোট",
  );
  await p.reload();
  await p.waitForSelector("#content h1");
  assert.equal(await p.evaluate(() => location.hash), "#notes");
  await p.evaluate(() => go("ledger"));
  await p.goBack();
  await p.waitForFunction(
    () =>
      location.hash === "#notes" &&
      document.querySelector("#content h1").textContent.includes("মনে রাখার"),
  );
  await p
    .getByRole("button", { name: "নিজের রেকর্ড খুঁজুন", exact: true })
    .click();
  await p.locator("#recordSearch").fill("<img");
  assert.equal(await p.locator("#searchResults img").count(), 0);
  assert(
    (await p.locator("#searchResults").innerText()).includes("<img src=x"),
  );
  await p.locator("#recordSearch").fill("বাজার");
  await p.locator(".search-result").click();
  assert.equal(await p.locator("#modal.hidden").count(), 1);
  assert.equal(await p.evaluate(() => location.hash), "#ledger");
  await p.evaluate(() => go("learn"));
  await p.locator("#coef_a").fill("");
  assert.equal(await p.locator("#coef_a").getAttribute("aria-invalid"), "true");
  assert.equal(await p.locator("#mathGraph path").count(), 0);
  await p.locator("#coef_a").fill("2");
  await p.locator("#coef_b").fill("-3");
  await p.locator("#coef_c").fill("4");
  assert(
    (await p.locator("#graphExplanation").innerText()).includes("y(2) = 6"),
  );
  assert((await p.locator("#graphExplanation").innerText()).includes("0.75"));
  const axeSource = fs.readFileSync(
    require.resolve(process.env.AXE_MODULE || "axe-core"),
    "utf8",
  );
  await p.addScriptTag({ content: axeSource });
  const routes = [
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
  ];
  let scans = 0,
    layouts = 0;
  for (const theme of ["light", "dark"]) {
    await p.evaluate(
      (theme) => document.body.classList.toggle("dark", theme === "dark"),
      theme,
    );
    for (const route of routes) {
      await p.evaluate((route) => go(route), route);
      const issues = await p.evaluate(async () =>
        (
          await axe.run(document, {
            runOnly: {
              type: "tag",
              values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"],
            },
          })
        ).violations.map((v) => ({
          id: v.id,
          nodes: v.nodes.map((n) => n.target),
        })),
      );
      assert.deepEqual(issues, [], `${route}/${theme} accessibility`);
      scans++;
    }
    await p.evaluate(() => go("notes"));
    await p.getByRole("button", { name: "নতুন নোট", exact: true }).click();
    const modalIssues = await p.evaluate(async () =>
      (await axe.run(document)).violations.map((v) => v.id),
    );
    assert.deepEqual(modalIssues, [], `modal/${theme}`);
    await p.keyboard.press("Escape");
    scans++;
  }
  for (const width of [320, 360, 390, 768, 1440]) {
    await p.setViewportSize({ width, height: 900 });
    for (const route of routes) {
      await p.evaluate((route) => go(route), route);
      assert(
        await p.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `${route} at ${width}px`,
      );
      layouts++;
    }
  }
  await p.evaluate(() => navigator.serviceWorker.ready);
  await p.waitForFunction(() => !!navigator.serviceWorker.controller);
  await p.evaluate(() => {
    document.body.classList.remove("dark");
    toggleTheme();
  });
  await p.context().setOffline(true);
  await p.reload({ waitUntil: "domcontentloaded" });
  await p.waitForSelector("#content h1");
  assert.equal(
    await p.evaluate(() => document.body.classList.contains("dark")),
    true,
  );
  assert.equal(
    await p.evaluate(
      async () => (await ChhayapothDomain.domain.list("ledger")).length,
    ),
    3,
  );
  await p.evaluate(() => go("home"));
  assert.equal(
    await p.locator(".dashboard-stats .metric.expense>strong").innerText(),
    "১২৩.৪৫৳",
  );
  await p.context().setOffline(false);
  assert.deepEqual(errors, []);
  await browser.close();
  console.log(
    `PASS: Bangla money input; exact BigInt currency/totals; source-backed chart/table; combined ledger filters; local escaped search; modal trap/return; form preservation; route reload/back; coefficient validation; ${scans} populated accessibility scans; ${layouts} layout checks; offline reload/local records; persisted theme; no page errors.`,
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
