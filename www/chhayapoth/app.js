/* Chhayapoth product shell. All user/remote text is escaped before HTML insertion. */
"use strict";
const $ = (id) => document.getElementById(id),
  D = ChhayapothDomain.domain;
const esc = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const ic = (x) => `<svg aria-hidden="true"><use href="#${x}"/></svg>`;
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const money = (n) =>
  new Intl.NumberFormat("bn-BD", { style: "currency", currency: "BDT" }).format(
    n / 100,
  );
const navs = [
  ["home", "home", "হোম"],
  ["agent", "spark", "AI এজেন্ট"],
  ["calendar", "calendar", "ক্যালেন্ডার"],
  ["more", "grid", "আরও"],
];
let page = "home",
  rows = [],
  month = new Date().getMonth(),
  year = new Date().getFullYear(),
  selected = today(),
  editing = false,
  toastTimer,
  renderVersion = 0,
  focusEnd = null,
  focusTimer = null,
  miniSession = null;
const byKind = (k) => rows.filter((r) => r.kind === k),
  native = () => !!window.NativeKit?.isNative;
function toast(text) {
  $("toast").textContent = text;
  $("toast").classList.remove("hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $("toast").classList.add("hidden"), 4500);
}
window.addEventListener("unhandledrejection", (e) => {
  e.preventDefault();
  toast(e.reason?.message || "কাজটি সম্পন্ন হয়নি। আবার চেষ্টা করুন।");
});
function head(title, kicker, action = "") {
  return `<div class="hero"><div><div class="eyebrow">${kicker}</div><h1>${title}</h1></div>${action}</div>`;
}
function addBtn(kind, label) {
  return `<button class="btn primary" onclick="recordForm('${kind}')">${ic("plus")}${label}</button>`;
}
function empty(s) {
  return `<p class="empty">${s}</p>`;
}
async function go(p) {
  if (miniSession) {
    await miniSession.stop().catch(() => {});
    miniSession = null;
  }
  page = p;
  editing = false;
  await render();
  window.scrollTo(0, 0);
}
async function render() {
  const token = ++renderVersion;
  rows = await D.list();
  if (token !== renderVersion) return;
  for (const id of ["desktopNav", "mobileNav"])
    $(id).innerHTML = navs
      .map(
        ([p, i, t]) =>
          `<button class="${id === "desktopNav" ? "navbtn " : ""}${page === p || (p === "more" && !navs.some((x) => x[0] === page)) ? "active" : ""}" onclick="go('${p}')" ${page === p ? 'aria-current="page"' : ""}>${ic(i)}<span>${t}</span></button>`,
      )
      .join("");
  const titles = {
    home: "হোম",
    agent: "AI এজেন্ট",
    calendar: "ক্যালেন্ডার",
    more: "আরও",
    habits: "অভ্যাস",
    ledger: "আয়-ব্যয়",
    learn: "শেখার স্পেস",
    care: "Care routines",
    weather: "আবহাওয়া",
    messages: "Nearby messages",
    apps: "Mini-apps",
    store: "Widget library",
    notes: "নোটস",
    settings: "সেটিংস",
  };
  $("breadcrumb").textContent = titles[page] || "ছায়াপথ";
  $("content").innerHTML = {
    home,
    agent,
    calendar,
    more,
    habits,
    ledger,
    learn,
    care,
    weather,
    messages,
    apps,
    store,
    notes,
    settings,
  }[page]();
  if (page === "learn") drawGraph();
  if (page === "weather") showWeatherCache();
  if (page === "messages") renderPeers();
  if (page === "apps") listApps();
  if (page === "settings") loadAudit();
}
function home() {
  const complete = byKind("habit").filter((h) =>
    h.logs.includes(today()),
  ).length;
  const expenses = byKind("ledger")
    .filter(
      (x) => x.type === "expense" && x.date.startsWith(today().slice(0, 7)),
    )
    .reduce((n, x) => n + x.amountMinor, 0);
  const widgets = byKind("widget").sort((a, b) => a.order - b.order);
  return (
    head(
      "দিনটা হোক আপনার মতো।",
      new Date().toLocaleDateString("bn-BD", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
      `<button class="btn" onclick="editing=!editing;render()">${ic("settings")}${editing ? "সম্পন্ন" : "হোম সাজান"}</button>`,
    ) +
    `<div class="grid"><div class="stack"><section class="card ai-card"><div class="ai-tag">${ic("spark")} CHHAYAPOTH · EVERYDAY COMPANION</div><h2>কম ব্যস্ততা,<br>আরও একটু নিজের সময়।</h2><p>শেখা, পরিকল্পনা আর ছোট ছোট কাজ—একটি ব্যক্তিগত স্পেসে। শুরু হোক একটি ছোট পদক্ষেপ দিয়ে।</p><div class="row"><button class="btn primary" onclick="go('agent')">${ic("spark")}এজেন্ট খুলুন</button><button class="btn" onclick="go('learn')">শিখতে শুরু করুন ↗</button></div><div class="quick"><button onclick="recordForm('event')">+ পরিকল্পনা</button><button onclick="recordForm('ledger')">+ খরচ / আয়</button><button onclick="go('store')">+ Widget</button></div></section><div class="mini-stats"><div class="stat"><strong>${byKind("event").filter((e) => localDay(e.at) === today()).length}</strong><small>আজকের পরিকল্পনা</small></div><div class="stat"><strong>${complete}/${byKind("habit").length}</strong><small>অভ্যাস সম্পন্ন</small></div><div class="stat"><strong style="font-size:20px">${money(expenses)}</strong><small>মাসের নথিভুক্ত খরচ</small></div></div>${agenda(today())}${widgets
      .filter((w) => ["ledger", "notes", "focus"].includes(w.template))
      .map(widgetCard)
      .join(
        "",
      )}<button class="btn" style="padding:16px;border-style:dashed" onclick="go('store')">${ic("plus")}নিজের মতো widget যোগ করুন</button></div><div class="stack"><section class="card"><div class="card-head"><span class="card-title">${new Date().toLocaleDateString("bn-BD", { month: "long", year: "numeric" })}</span><button class="link" onclick="go('calendar')">ক্যালেন্ডার ↗</button></div>${calendarGrid(new Date().getMonth(), new Date().getFullYear(), true)}</section>${habitCard()}<section class="card"><div class="card-head"><span class="card-title">আপনার প্রয়োজন, এক জায়গায়</span></div><div class="mini-apps"><button onclick="go('learn')"><span class="appicon mint">${ic("book")}</span>শিখুন</button><button onclick="go('ledger')"><span class="appicon blue">${ic("grid")}</span>হিসাব</button><button onclick="go('messages')"><span class="appicon">${ic("message")}</span>Nearby</button><button onclick="go('apps')"><span class="appicon">${ic("plus")}</span>Apps</button></div></section><div class="notice">Core utilities কাজ করে। Native AI, notification ও Nearby-এর জন্য Android/iOS build দরকার।</div></div></div>`
  );
}
function localDay(iso) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function agenda(day) {
  const es = byKind("event")
    .filter((e) => localDay(e.at) === day)
    .sort((a, b) => a.at.localeCompare(b.at));
  return `<section class="card"><div class="card-head"><span class="card-title">${ic("calendar")}${day === today() ? "আজকের পরিকল্পনা" : esc(day)}</span><button class="link" onclick="recordForm('event')">+ নতুন</button></div>${es.length ? es.map((e, i) => `<div class="rowitem"><div><strong style="font-size:13px">${esc(e.title)}</strong><p>${new Date(e.at).toLocaleTimeString("bn-BD", { hour: "2-digit", minute: "2-digit" })} · ${esc(e.note)}</p></div>${actions(e)}</div>`).join("") : empty("এখনও পরিকল্পনা নেই। একটি ছোট কাজ দিয়ে শুরু করুন।")}</section>`;
}
function actions(r) {
  return `<div class="row"><button class="link" onclick="recordForm('${r.kind}','${r.id}')" aria-label="Edit ${esc(r.title)}">সম্পাদনা</button><button class="link" onclick="deleteRecord('${r.id}')" aria-label="Delete ${esc(r.title)}">মুছুন</button></div>`;
}
function calendarGrid(m, y, mini = false) {
  let first = new Date(y, m, 1).getDay(),
    count = new Date(y, m + 1, 0).getDate();
  return `<div class="days">${["রবি", "সোম", "মঙ্গল", "বুধ", "বৃহঃ", "শুক্র", "শনি"].map((x) => `<span>${x}</span>`).join("")}</div><div class="calgrid">${"<span></span>".repeat(first)}${Array.from(
    { length: count },
    (_, i) => {
      const day = `${y}-${String(m + 1).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`;
      return `<button class="${selected === day ? "selected " : ""}${day === today() ? "today " : ""}${byKind("event").some((e) => localDay(e.at) === day) ? "has" : ""}" onclick="selectDate('${day}')">${i + 1}</button>`;
    },
  ).join("")}</div>`;
}
function selectDate(day) {
  selected = day;
  year = Number(day.slice(0, 4));
  month = Number(day.slice(5, 7)) - 1;
  go("calendar");
}
function calendar() {
  return (
    head(
      "আপনার সময়, এক নজরে।",
      "CALENDAR & PLANNER",
      addBtn("event", "নতুন পরিকল্পনা"),
    ) +
    `<div class="grid"><section class="card"><div class="card-head"><button class="btn" onclick="changeMonth(-1)" aria-label="Previous month">←</button><strong>${new Date(year, month, 1).toLocaleDateString("bn-BD", { month: "long", year: "numeric" })}</strong><button class="btn" onclick="changeMonth(1)" aria-label="Next month">→</button></div>${calendarGrid(month, year)}</section><div class="stack">${agenda(selected)}<div class="notice">এই calendar-এর data Home ও agent domain tools-এ একই থাকে। আপনার original Pro Planner আলাদা sandboxed mini-app হিসেবে Library-তে আছে; তার database এখনো migrate করা হয়নি।</div><button class="btn" onclick="go('apps')">Original Pro Planner খুলুন ↗</button></div></div>`
  );
}
function changeMonth(n) {
  const d = new Date(year, month + n, 1);
  year = d.getFullYear();
  month = d.getMonth();
  selected = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  render();
}
function habitCard() {
  const hs = byKind("habit");
  return `<section class="card"><div class="card-head"><span class="card-title">${ic("leaf")}একটু একটু করে, প্রতিদিন</span><button class="link" onclick="recordForm('habit')">+ অভ্যাস</button></div>${hs.length ? hs.map((h) => `<div class="habit"><span class="habit-icon">${ic("leaf")}</span><div class="habit-name">${esc(h.title)}<small>${h.logs.length} দিন নথিভুক্ত</small></div><button class="check ${h.logs.includes(today()) ? "done" : ""}" aria-label="Toggle ${esc(h.title)}" aria-pressed="${h.logs.includes(today())}" onclick="toggleHabit('${h.id}')">${h.logs.includes(today()) ? "✓" : ""}</button></div>`).join("") : empty("আজ থেকেই একটি ভালো অভ্যাস গড়ুন।")}</section>`;
}
async function toggleHabit(id) {
  const h = rows.find((x) => x.id === id);
  let logs = h.logs.includes(today())
    ? h.logs.filter((x) => x !== today())
    : [...h.logs, today()];
  await D.update(id, { logs }, h.revision);
  await render();
}
function habits() {
  return (
    head(
      "ছোট অভ্যাসে, বড় পরিবর্তন।",
      "HABITS",
      addBtn("habit", "নতুন অভ্যাস"),
    ) +
    habitCard() +
    `<section class="card" style="margin-top:20px">${byKind("habit")
      .map(
        (h) =>
          `<div class="rowitem"><div><strong>${esc(h.title)}</strong><p>সম্পন্ন দিন: ${h.logs.map(esc).join(", ") || "এখনো নেই"}</p></div>${actions(h)}</div>`,
      )
      .join(
        "",
      )}<button class="btn" style="margin-top:15px" onclick="go('apps')">Original ProFit analytics ↗</button></section>`
  );
}
function ledger() {
  let inc = 0,
    out = 0;
  byKind("ledger").forEach((t) =>
    t.type === "income" ? (inc += t.amountMinor) : (out += t.amountMinor),
  );
  return (
    head(
      "হিসাব থাকুক পরিষ্কার।",
      "INCOME & EXPENSES",
      addBtn("ledger", "নতুন এন্ট্রি"),
    ) +
    `<div class="mini-stats" style="margin-bottom:20px"><div class="stat"><strong style="font-size:23px">${money(inc)}</strong><small>নথিভুক্ত আয়</small></div><div class="stat"><strong style="font-size:23px">${money(out)}</strong><small>নথিভুক্ত খরচ</small></div><div class="stat"><strong style="font-size:23px">${money(inc - out)}</strong><small>পার্থক্য</small></div></div><section class="card">${
      byKind("ledger").length
        ? byKind("ledger")
            .sort((a, b) => b.date.localeCompare(a.date))
            .map(
              (t) =>
                `<div class="rowitem"><div><strong>${esc(t.title)}</strong><p>${esc(t.category)} · ${esc(t.date)}</p><span class="amount ${t.type}">${t.type === "expense" ? "−" : "+"}${money(t.amountMinor)}</span></div>${actions(t)}</div>`,
            )
            .join("")
        : empty("প্রথম আয় বা খরচটি নথিভুক্ত করুন।")
    }</section><p class="section-desc">এটি শুধু আপনার নথিভুক্ত লেনদেনের হিসাব, bank balance বা financial advice নয়।</p>`
  );
}
function field(label, name, value = "", type = "text", required = true) {
  return `<label class="field">${label}<input type="${type}" name="${name}" value="${esc(value)}" ${required ? "required" : ""} maxlength="${type === "text" ? 160 : 200}"></label>`;
}
function recordForm(kind, id) {
  const r = rows.find((x) => x.id === id) || {};
  let content = field("নাম / বিবরণ", "title", r.title || "");
  if (kind === "event" || kind === "reminder") {
    const d = r.at ? new Date(r.at) : new Date(selected + "T17:00:00");
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    content += field("তারিখ ও সময়", "at", local, "datetime-local");
    content += field(
      kind === "reminder"
        ? "চিকিৎসকের নির্দেশ অনুযায়ী নোট (ঐচ্ছিক)"
        : "নোট (ঐচ্ছিক)",
      "note",
      r.note || "",
      "text",
      false,
    );
  }
  if (kind === "ledger") {
    content +=
      `<label class="field">ধরন<select name="type"><option value="expense">খরচ</option><option value="income" ${r.type === "income" ? "selected" : ""}>আয়</option></select></label>` +
      field(
        "পরিমাণ (BDT)",
        "amount",
        r.amountMinor ? (r.amountMinor / 100).toFixed(2) : "",
        "text",
      ) +
      field("বিভাগ", "category", r.category || "General") +
      field("তারিখ", "date", r.date || today(), "date");
  }
  if (kind === "note")
    content += `<label class="field">নোট<textarea name="body" maxlength="10000">${esc(r.body || "")}</textarea></label>`;
  openModal(
    `<h2>${id ? "সম্পাদনা" : "নতুন রেকর্ড"}</h2>${kind === "reminder" ? '<div class="notice">শুধু চিকিৎসকের নির্ধারিত schedule লিখুন। নতুন ওষুধ বা dose নির্ধারণ নয়। Save করা মানেই notification schedule নয়।</div>' : ""}<form class="formgrid" onsubmit="event.preventDefault();saveRecord(this,'${kind}','${id || ""}',${r.revision || 0})">${content}<button class="btn primary">সংরক্ষণ করুন</button><div class="progress-msg" id="formError" role="alert"></div></form>`,
  );
}
async function saveRecord(form, kind, id, rev) {
  const button = form.querySelector("button");
  button.disabled = true;
  try {
    if (
      id &&
      kind === "reminder" &&
      rows.find((r) => r.id === id)?.notificationStatus === "scheduled"
    )
      throw new Error("আগে এই reminder-এর scheduled notification cancel করুন।");
    const data = Object.fromEntries(new FormData(form));
    if (data.at) data.at = new Date(data.at).toISOString();
    if (kind === "habit" && !id) data.logs = [];
    if (kind === "ledger") {
      data.amountMinor = ChhayapothDomain.parseMoney(data.amount);
      delete data.amount;
    }
    if (id) await D.update(id, data, rev);
    else await D.create(kind, data);
    closeModal();
    await render();
    toast("তথ্য সংরক্ষিত হয়েছে।");
  } catch (e) {
    $("formError").textContent = e.message;
    button.disabled = false;
  }
}
async function deleteRecord(id) {
  const r = rows.find((x) => x.id === id);
  if (!confirm(`“${r.title}” মুছবেন? এই কাজ undo করা যাবে না।`)) return;
  if (r.kind === "reminder" && r.notificationStatus === "scheduled") {
    if (!native())
      throw new Error(
        "Native scheduled reminder cancel করতে native app ব্যবহার করুন।",
      );
    await NativeKit.notifications.cancel([r.notificationId]);
  }
  await D.remove(id, r.revision);
  await render();
  toast("রেকর্ড মুছে ফেলা হয়েছে।");
}
function notes() {
  return (
    head("মনে রাখার ছোট স্পেস।", "NOTES", addBtn("note", "নতুন নোট")) +
    `<div class="store-grid">${
      byKind("note")
        .map(
          (n) =>
            `<section class="card"><h3>${esc(n.title)}</h3><p style="white-space:pre-wrap;font-size:13px">${esc(n.body)}</p>${actions(n)}</section>`,
        )
        .join("") || empty("আপনার প্রথম নোটটি লিখুন।")
    }</div>`
  );
}
function widgetCard(w) {
  let body =
    w.template === "ledger"
      ? `<p class="section-desc">${byKind("ledger").length}টি লেনদেন নথিভুক্ত।</p><button class="btn" onclick="go('ledger')">হিসাব খুলুন ↗</button>`
      : w.template === "notes"
        ? `<p class="section-desc">${byKind("note").length}টি নোট</p><button class="btn" onclick="go('notes')">নোটস ↗</button>`
        : `<div class="focus-time" id="focusClock">${focusText()}</div><button class="btn" onclick="startFocus()">${focusEnd ? "পুনরায় ২৫ মিনিট" : "২৫ মিনিট শুরু"}</button>`;
  return `<section class="card"><div class="card-head"><span class="card-title">${esc(w.title)}</span>${editing ? `<div class="row"><button class="link" onclick="moveWidget('${w.id}',-1)">↑</button><button class="link" onclick="moveWidget('${w.id}',1)">↓</button><button class="link" onclick="deleteRecord('${w.id}')">সরান</button></div>` : ""}</div>${body}</section>`;
}
async function moveWidget(id, direction) {
  const ws = byKind("widget").sort((a, b) => a.order - b.order),
    i = ws.findIndex((w) => w.id === id),
    j = i + direction;
  if (j < 0 || j >= ws.length) return;
  const a = ws[i],
    b = ws[j];
  await D.update(a.id, { order: j }, a.revision);
  await D.update(b.id, { order: i }, b.revision);
  await render();
}
function store() {
  return (
    head("নিজের মতো সাজিয়ে নিন।", "WIDGET LIBRARY") +
    `<p class="section-desc">Curated templates; custom code এখানে host DOM-এ চালানো হয় না। Agenda ও habits Home-এ স্থায়ী core cards।</p><div class="store-grid">${[
      ["ledger", "আয়-ব্যয়ের সারাংশ", "নথিভুক্ত হিসাব এক নজরে।"],
      ["notes", "Quick notes", "মনে রাখার জিনিসগুলো কাছেই।"],
      ["focus", "Focus timer", "শুধু ফোকাসের জন্য ২৫ মিনিট।"],
    ]
      .map(
        ([t, name, desc]) =>
          `<section class="store-item"><span class="appicon mint">${ic(t === "focus" ? "clock" : "grid")}</span><h3>${name}</h3><p>${desc}</p><button class="btn primary" onclick="addWidget('${t}','${name}')">হোমে যোগ করুন</button></section>`,
      )
      .join(
        "",
      )}</div><div class="notice" style="margin-top:20px">Android launcher/floating widget controls ও agent-created mini-apps বিদ্যমান native workspace-এ আছে। Web preview-তে native capability দাবি করা হচ্ছে না।</div>`
  );
}
async function addWidget(template, title) {
  if (byKind("widget").some((w) => w.template === template))
    return toast("এই widget ইতিমধ্যে হোমে আছে।");
  await D.create("widget", { template, title, order: byKind("widget").length });
  await go("home");
  toast("Widget যোগ হয়েছে।");
}
function focusText() {
  const sec = focusEnd
    ? Math.max(0, Math.ceil((focusEnd - Date.now()) / 1000))
    : 1500;
  return `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;
}
function startFocus() {
  focusEnd = Date.now() + 25 * 60000;
  clearInterval(focusTimer);
  focusTimer = setInterval(() => {
    if ($("focusClock")) $("focusClock").textContent = focusText();
    if (Date.now() >= focusEnd) {
      clearInterval(focusTimer);
      focusEnd = null;
      toast("ফোকাস সেশন সম্পন্ন।");
    }
  }, 1000);
  render();
}
function more() {
  const links = [
    ["learn", "book", "শেখার স্পেস", "গণিতের গ্রাফ, অনুশীলন ও feedback"],
    ["care", "shield", "Care routines", "নির্ধারিত reminder ও স্বাস্থ্যতথ্য"],
    ["ledger", "grid", "আয়-ব্যয়", "আপনার হিসাব, আপনার নিয়ন্ত্রণে"],
    [
      "weather",
      "drop",
      "আবহাওয়া ও প্রস্তুতি",
      "Source-labelled তথ্য ও checklist",
    ],
    [
      "messages",
      "message",
      "Nearby messages",
      "সামঞ্জস্যপূর্ণ কাছের device-এ যোগাযোগ",
    ],
    ["habits", "leaf", "অভ্যাস", "আজকের ছোট পদক্ষেপ"],
    [
      "apps",
      "grid",
      "Mini-app library",
      "Original planner, tracker এবং import",
    ],
    ["store", "plus", "Widget library", "হোমকে নিজের মতো সাজান"],
    ["notes", "book", "নোটস", "মনে রাখার ব্যক্তিগত স্পেস"],
    ["settings", "settings", "সেটিংস", "Backup, restore ও activity log"],
  ];
  return (
    head("আপনার জন্য আরও কিছু।", "EXPLORE CHHAYAPOTH") +
    `<div class="menu-grid">${links.map(([p, i, t, s]) => `<button class="menu-card" onclick="go('${p}')"><span class="appicon mint">${ic(i)}</span><div><strong>${t}</strong><small>${s}</small></div></button>`).join("")}</div>`
  );
}
function agent() {
  return (
    head("কী গুছিয়ে দেব আজ?", "PERSONAL AGENT") +
    `<section class="card ai-card"><div class="ai-tag">${ic("spark")} REAL NATIVE WORKSPACE</div><h2>কথা থেকে কাজে।</h2><p>বিদ্যমান native agent workspace-এ provider profiles, model routing, tool approvals, memory ও mini-app creation আছে। নতুন Chhayapoth domain tools Calendar, Habits, Ledger, Notes ও Home widgets-এর একই data ব্যবহার করে।</p><a class="btn primary" href="./agent.html">পূর্ণ AI Workspace খুলুন ↗</a></section><section class="card" style="margin-top:20px"><h3>যে অনুরোধগুলো করতে পারেন</h3><ul class="section-desc"><li>“আগামীকাল বিকেল ৫টায় গণিত পড়ার event রাখো—সময় নিশ্চিত করে নাও।”</li><li>“আজ বাজারে ৪৫০ টাকা খরচ করেছি, General category-তে লগ করো।”</li><li>“আমার নোট দেখার Home widget যোগ করো।”</li></ul><div class="notice">Browser preview-তে native model engine নেই। এখানে fake chat response দেখানো হয় না। Model provider-এ prompt/data যেতে পারে; free-tier quota পরিবর্তনশীল। নতুন domain tools-এর default approval always-ask; Advanced অনুমতি চাইলে প্রতি tool-এর scope বিবেচনা করুন।</div></section>`
  );
}
function learn() {
  return (
    head("বোঝা থেকে শেখার শুরু।", "LEARNING STUDIO") +
    `<div class="grid"><section class="card"><div class="card-head"><span class="card-title">Quadratic graph · y = ax² + bx + c</span></div><p class="section-desc">a, b, c বদলে গ্রাফ দেখুন। এটি deterministic গণনা—AI-generated answer নয়।</p><div class="row">${["a", "b", "c"].map((x, i) => `<label class="field" style="flex:1">${x}<input id="coef_${x}" type="number" min="-10" max="10" step="0.5" value="${i === 0 ? 1 : 0}" oninput="drawGraph()"></label>`).join("")}</div><svg id="mathGraph" class="graph" viewBox="0 0 480 250" role="img" aria-label="Quadratic function plot"></svg><p class="section-desc" id="graphExplanation"></p></section><section class="card"><h3>ধারণাটি বুঝি</h3><p class="section-desc">x-এর প্রতিটি মানে y হিসাব করে একটি বিন্দু পাওয়া যায়। y = x² হলে x = −২ ও x = ২, উভয় ক্ষেত্রেই y = ৪। তাই গ্রাফটি y অক্ষের দুই পাশে সমমিত। a ঋণাত্মক হলে parabola নিচের দিকে খোলে।</p><div class="notice">এটি সীমিত, হাতে লেখা learning content। Curriculum-wide tutor বা high-stakes grading নয়। পূর্ণ agent ব্যবহার করলে সংখ্যাগত ফল স্বাধীনভাবে যাচাই করুন।</div><button class="btn" style="margin-top:15px" onclick="go('agent')">এজেন্টের সাহায্য নিন ↗</button></section></div><section class="card" style="margin-top:20px"><h3>নিজে চেষ্টা করুন</h3><form class="formgrid" onsubmit="event.preventDefault();checkQuiz(this)">${field("১. y = x²; x = ৩ হলে y কত?", "q1", "", "number")}${field("২. y = 2x + 1 রেখাটির slope কত?", "q2", "", "number")}${field("৩. y = x²-এর vertex-এর x coordinate কত?", "q3", "", "number")}<button class="btn primary">উত্তর যাচাই করুন</button></form><div id="quizResult"></div><p class="section-desc" style="margin-top:14px">আগের অনুশীলন: ${byKind("quiz").length}টি।</p></section>`
  );
}
function drawGraph() {
  if (!$("mathGraph")) return;
  const a = Number($("coef_a").value),
    b = Number($("coef_b").value),
    c = Number($("coef_c").value);
  if (![a, b, c].every((v) => Number.isFinite(v) && Math.abs(v) <= 10)) {
    $("graphExplanation").textContent =
      "প্রতিটি coefficient −১০ থেকে ১০-এর মধ্যে দিন।";
    return;
  }
  let lines = "";
  for (let x = -10; x <= 10; x++)
    lines += `<line x1="${240 + x * 20}" y1="5" x2="${240 + x * 20}" y2="245" stroke="#dbe5df" stroke-width=".5"/>`;
  for (let y = -5; y <= 5; y++)
    lines += `<line x1="20" y1="${125 + y * 20}" x2="460" y2="${125 + y * 20}" stroke="#dbe5df" stroke-width=".5"/>`;
  let path = "";
  for (let x = -11; x <= 11; x += 0.025) {
    let y = a * x * x + b * x + c;
    path += `${path ? "L" : "M"}${(240 + x * 20).toFixed(1)},${Math.max(-10000, Math.min(10000, 125 - y * 20)).toFixed(1)} `;
  }
  $("mathGraph").innerHTML =
    `<defs><clipPath id="plotClip"><rect x="20" y="5" width="440" height="240"/></clipPath></defs>${lines}<path d="M20 125H460M240 5V245" stroke="#8ca99d"/><path d="${path}" stroke="#165e65" stroke-width="2.3" fill="none" clip-path="url(#plotClip)"/><text x="450" y="141" font-size="12" fill="#617b70">x</text><text x="247" y="15" font-size="12" fill="#617b70">y</text>`;
  $("graphExplanation").textContent =
    a === 0
      ? `এটি linear/constant function। y(2) = ${b * 2 + c}`
      : `${a > 0 ? "উপরের" : "নিচের"} দিকে খোলা parabola। Vertex-এর x = ${(-b / (2 * a)).toFixed(2)}। y(2) = ${4 * a + 2 * b + c}।`;
}
async function checkQuiz(f) {
  const got = [f.q1.value, f.q2.value, f.q3.value].map(Number),
    correct = [9, 2, 0],
    score = got.filter((v, i) => v === correct[i]).length;
  await D.create("quiz", { title: "Algebra practice", correct: score });
  $("quizResult").innerHTML =
    `<div class="notice" style="margin-top:15px"><strong>${score}/3 সঠিক</strong><br>১. 3² = 9।<br>২. y = mx + c-তে slope m = 2।<br>৩. x²-এর সর্বনিম্ন মান x = 0-তে।</div><button class="btn" style="margin-top:12px" onclick="recordForm('event')">Revision পরিকল্পনা রাখুন</button>`;
  toast("Practice result সংরক্ষিত হয়েছে।");
}
function care() {
  return (
    head(
      "নিজের যত্ন, নিয়ম মেনে।",
      "CARE ROUTINES",
      addBtn("reminder", "নতুন reminder"),
    ) +
    `<div class="notice" style="margin-bottom:20px">এটি চিকিৎসা বা জরুরি সেবার বিকল্প নয়। নতুন ওষুধ, dose change, diagnosis বা personalised pregnancy advice এখানে দেওয়া হয় না। গুরুতর বা দ্রুত খারাপ হওয়া উপসর্গে qualified medical care নিন।</div><div class="grid"><section class="card"><h3>আপনার নির্ধারিত schedule</h3>${
      byKind("reminder")
        .map(
          (r) =>
            `<div class="rowitem"><div><strong>${esc(r.title)}</strong><p>${new Date(r.at).toLocaleString("bn-BD")}<br>${esc(r.note)}<br>Notification: ${esc(r.notificationStatus)}</p><button class="btn" onclick="${r.notificationStatus === "scheduled" ? "cancelSchedule" : "scheduleReminder"}('${r.id}')">${r.notificationStatus === "scheduled" ? "Notification বন্ধ করুন" : "Native notification schedule"}</button></div>${actions(r)}</div>`,
        )
        .join("") ||
      empty("চিকিৎসকের দেওয়া schedule অনুযায়ী নিজের reminder লিখতে পারেন।")
    }</section><section class="card safe-links"><h3>বিশ্বস্ত তথ্যসূত্র</h3><a href="https://www.who.int/health-topics/maternal-health" target="_blank" rel="noopener noreferrer">WHO · Maternal health ↗</a><a href="https://www.who.int/health-topics/physical-activity" target="_blank" rel="noopener noreferrer">WHO · Physical activity ↗</a><a href="https://dghs.gov.bd/" target="_blank" rel="noopener noreferrer">স্বাস্থ্য অধিদপ্তর ↗</a><p class="section-desc">ওয়েবসাইটে যেতে internet লাগবে। Prescribed reminder-এর configuration যাচাই করুন; notification delivery OS restrictions-এর ওপর নির্ভরশীল।</p></section></div>`
  );
}
async function scheduleReminder(id) {
  if (!native())
    return toast(
      "Native notification শুধু Android/iOS app-এ। এখানে schedule করা হয়নি।",
    );
  const r = rows.find((x) => x.id === id);
  if (Date.parse(r.at) <= Date.now())
    throw new Error("ভবিষ্যতের সময় বেছে নিন।");
  const permission = await NativeKit.notifications.request();
  if (permission.display !== "granted")
    throw new Error("Notification permission দেওয়া হয়নি।");
  const pending = await NativeKit.notifications.pending();
  let nid;
  do {
    nid = (crypto.getRandomValues(new Uint32Array(1))[0] % 2147483646) + 1;
  } while (pending.notifications.some((n) => n.id === nid));
  await NativeKit.notifications.schedule([
    {
      id: nid,
      title: r.title,
      body: r.note || "আপনার নির্ধারিত reminder",
      schedule: { at: new Date(r.at) },
    },
  ]);
  try {
    await D.update(
      id,
      { notificationStatus: "scheduled", notificationId: nid },
      r.revision,
    );
  } catch (e) {
    await NativeKit.notifications.cancel([nid]);
    throw e;
  }
  await render();
  toast("OS scheduling request গ্রহণ করেছে; delivery নিশ্চিত নয়।");
}
async function cancelSchedule(id) {
  if (!native()) throw new Error("Native app প্রয়োজন।");
  const r = rows.find((x) => x.id === id);
  await NativeKit.notifications.cancel([r.notificationId]);
  await D.update(id, { notificationStatus: "not-scheduled" }, r.revision);
  await render();
}
const places = {
  dhaka: { name: "ঢাকা", lat: 23.81, lon: 90.41 },
  sylhet: { name: "সিলেট", lat: 24.89, lon: 91.87 },
  chattogram: { name: "চট্টগ্রাম", lat: 22.36, lon: 91.78 },
  khulna: { name: "খুলনা", lat: 22.85, lon: 89.54 },
  rajshahi: { name: "রাজশাহী", lat: 24.37, lon: 88.6 },
  barishal: { name: "বরিশাল", lat: 22.7, lon: 90.35 },
  rangpur: { name: "রংপুর", lat: 25.75, lon: 89.25 },
  mymensingh: { name: "ময়মনসিংহ", lat: 24.75, lon: 90.41 },
};
function weather() {
  return (
    head("জেনে নিন, প্রস্তুত থাকুন।", "WEATHER & PREPAREDNESS") +
    `<div class="grid"><section class="card"><h3>সাধারণ আবহাওয়ার তথ্য</h3><label class="field">শহর<select id="weatherPlace" onchange="showWeatherCache()">${Object.entries(
      places,
    )
      .map(([key, v]) => `<option value="${key}">${v.name}</option>`)
      .join(
        "",
      )}</select></label><button class="btn primary" style="margin-top:15px" onclick="fetchWeather()">আবহাওয়া আপডেট করুন</button><div id="weatherInfo"></div><p class="section-desc">Source: Open-Meteo · সাধারণ model-based weather data, official disaster warning নয়। নির্বাচিত শহর ও network provider-এর সঙ্গে query share হবে।</p></section><section class="card safe-links"><h3>Official warnings</h3><a href="https://www.bmd.gov.bd/web/bn/warning" target="_blank" rel="noopener noreferrer">বাংলাদেশ আবহাওয়া অধিদপ্তর ↗</a><a href="https://ffwc.gov.bd/" target="_blank" rel="noopener noreferrer">Flood Forecasting & Warning Centre ↗</a><div class="notice">Official warning feed এখনো integrate করা হয়নি। কোনো “সব নিরাপদ” বা live warning status এখানে দেখানো হয় না।</div></section></div><section class="card" style="margin-top:20px"><h3>সাধারণ প্রস্তুতির checklist</h3><ul class="section-desc"><li>বিশ্বস্ত কর্তৃপক্ষের হালনাগাদ নির্দেশনা যাচাই করুন।</li><li>জরুরি যোগাযোগ, প্রয়োজনীয় নথি এবং নিয়মিত prescribed medicine প্রস্তুত রাখুন।</li><li>ফোনের charge ও বিকল্প power source নিশ্চিত করার চেষ্টা করুন।</li><li>স্থানীয় কর্তৃপক্ষের নির্দেশনা অনুসরণ করুন; অযাচাইকৃত route বা আশ্রয়কেন্দ্রের খবর বিশ্বাস করবেন না।</li></ul></section>`
  );
}
function showWeatherCache() {
  if (!$("weatherInfo")) return;
  let cache;
  try {
    cache = JSON.parse(localStorage.getItem("chhayapoth.weather.v1") || "null");
  } catch {}
  const place = $("weatherPlace").value;
  if (
    !cache ||
    cache.place !== place ||
    !Number.isFinite(cache.temperature) ||
    !Number.isFinite(cache.wind)
  ) {
    $("weatherInfo").innerHTML = empty(
      "এই শহরের সংরক্ষিত তথ্য নেই। Internet থাকলে update করুন।",
    );
    return;
  }
  const stale = Date.now() - cache.fetchedAt > 2 * 3600000;
  $("weatherInfo").innerHTML =
    `<div class="weather-stat">${cache.temperature}°C</div><p class="section-desc">${esc(places[place].name)} · wind ${cache.wind} km/h<br>Model time: ${esc(cache.time)}<br>Last fetched: ${new Date(cache.fetchedAt).toLocaleString("bn-BD")}<br><strong>${stale ? "পুরোনো cached data—বর্তমান অবস্থা নয়" : "সর্বশেষ fetched data—official warning নয়"}</strong></p>`;
}
async function fetchWeather() {
  const place = $("weatherPlace").value,
    p = places[place];
  $("weatherInfo").textContent = "তথ্য আনা হচ্ছে…";
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${p.lat}&longitude=${p.lon}&current=temperature_2m,wind_speed_10m&timezone=Asia%2FDhaka`;
    const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error("Weather provider unavailable");
    const data = await response.json();
    if (
      !Number.isFinite(data.current?.temperature_2m) ||
      !Number.isFinite(data.current?.wind_speed_10m)
    )
      throw new Error("Weather response invalid");
    localStorage.setItem(
      "chhayapoth.weather.v1",
      JSON.stringify({
        place,
        temperature: data.current.temperature_2m,
        wind: data.current.wind_speed_10m,
        time: data.current.time,
        fetchedAt: Date.now(),
      }),
    );
    showWeatherCache();
  } catch (e) {
    showWeatherCache();
    toast("আপডেট হয়নি: " + e.message);
  }
}
function apps() {
  return (
    head("ছোট অ্যাপ, প্রয়োজনমতো।", "MINI-APP LIBRARY") +
    `<div class="notice" style="margin-bottom:20px">Original HTML apps native build-এর আলাদা sandbox/profile-এ চলবে; web preview-তে launch বন্ধ। তাদের data নতুন shared calendar/habits-এর সঙ্গে স্বয়ংক্রিয়ভাবে মিশবে না। Import করলে permissions review করুন। Public submission store এখনো নেই।</div><div class="menu-grid"><button class="menu-card" onclick="launchBuiltin('planner')">${ic("calendar")}<div><strong>Pro Planner</strong><small>আপনার supplied calendar ও document studio</small></div></button><button class="menu-card" onclick="launchBuiltin('profit')">${ic("leaf")}<div><strong>ProFit Habits</strong><small>আপনার supplied habit tracker ও analytics</small></div></button><button class="menu-card" onclick="document.getElementById('appImport').click()">${ic("plus")}<div><strong>Import mini-app</strong><small>HTML / ZIP · sandboxed network policy</small></div></button><a class="menu-card" href="./agent.html" style="text-decoration:none;color:inherit">${ic("spark")}<div><strong>Create with agent</strong><small>Native workspace ও existing staging tools</small></div></a></div><input hidden id="appImport" type="file" accept=".html,.htm,.zip" onchange="importMini(this)"><section class="card" style="margin-top:20px"><h3>Installed packages</h3><div id="installedApps"></div></section>`
  );
}
async function getKit() {
  const kit = window.NativeKit;
  if (!kit) throw new Error("NativeKit bridge এখনো লোড হয়নি।");
  await kit.ready();
  return kit;
}
async function launchBuiltin(name) {
  if (!["planner", "profit"].includes(name)) return;
  if (!native())
    return toast(
      "Original planner/tracker-এর IndexedDB-এর জন্য native isolated profile দরকার। Web preview-তে launch বন্ধ রাখা হয়েছে।",
    );
  const kit = await getKit();
  const id = "chhayapoth." + name;
  let existing = (await kit.appBrowser.list()).find((x) => x.id === id);
  if (!existing) {
    if (
      !confirm(
        "এই bundled app আলাদা sandbox-এ install করবেন? Shared domain data-তে access পাবে না।",
      )
    )
      return;
    const response = await fetch(`./builtins/${name}.json`);
    if (!response.ok) throw new Error("Package not found");
    const pkg = await response.json();
    await kit.appBrowser.install(pkg);
  }
  await launchMini(id);
}
async function listApps() {
  if (!$("installedApps")) return;
  try {
    const kit = await getKit();
    const apps = await kit.appBrowser.list();
    if ($("installedApps"))
      $("installedApps").innerHTML =
        apps
          .map(
            (a) =>
              `<div class="rowitem"><div><strong>${esc(a.manifest.name)}</strong><p>${esc(a.id)} · ${esc(a.manifest.networkMode || "policy controlled")}</p></div><div class="row"><button class="btn" onclick="launchMini('${a.id.replace(/[^a-z0-9._-]/g, "")}')">খুলুন</button><button class="link" onclick="removeMini('${a.id.replace(/[^a-z0-9._-]/g, "")}')">মুছুন</button></div></div>`,
          )
          .join("") || empty("কোনো package install করা হয়নি।");
  } catch (e) {
    if ($("installedApps")) $("installedApps").textContent = e.message;
  }
}
async function launchMini(id) {
  const kit = await getKit();
  openModal('<h2>Mini-app</h2><div id="miniHost" class="mini-host"></div>');
  $("modal").querySelector(".modal-card").style.maxWidth = "1100px";
  miniSession = await kit.appBrowser.launch(id, $("miniHost"));
}
async function removeMini(id) {
  if (!confirm("এই package এবং এর নিজস্ব data মুছবেন?")) return;
  const kit = await getKit();
  await kit.appBrowser.remove(id);
  await listApps();
}
async function importMini(input) {
  const file = input.files[0];
  if (!file) return;
  try {
    if (file.size > 15 * 1024 * 1024) throw new Error("Maximum 15 MB");
    if (
      !confirm(
        "অবিশ্বস্ত code হতে পারে। Sandbox-এ install করবেন? Network access default বন্ধ থাকবে।",
      )
    )
      return;
    const kit = await getKit();
    await kit.appBrowser.installFromFiles([file], {
      networkMode: "sandboxed",
      requestedCapabilities: [],
    });
    await listApps();
    toast("Package install হয়েছে। Native permissions আলাদা policy-নিয়ন্ত্রিত।");
  } finally {
    input.value = "";
  }
}
function settings() {
  return (
    head("নিয়ন্ত্রণ থাকুক আপনার হাতে।", "SETTINGS & DATA") +
    `<section class="card"><h3>আপনার local data</h3><p class="section-desc">Shared records এই app origin-এর IndexedDB-তে থাকে। এটি encrypted vault বা cloud sync নয়। Device/browser data মুছে গেলে backup ছাড়া ফিরে পাওয়া যাবে না। Mini-app storage আলাদা; নিচের backup-এ অন্তর্ভুক্ত নয়।</p><div class="row"><button class="btn primary" onclick="exportBackup()">JSON backup</button><button class="btn" onclick="document.getElementById('restoreFile').click()">Restore backup</button><button class="btn" onclick="document.body.classList.toggle('dark');localStorage.setItem('chhayapoth.theme',document.body.classList.contains('dark')?'dark':'light')">Light / Dark</button></div><input hidden type="file" id="restoreFile" accept=".json" onchange="restoreBackup(this)"><h3>AI provider ও tool permissions</h3><a class="btn" href="./agent.html">Native workspace settings ↗</a><p class="section-desc">Credentials কখনো chat বা source code-এ রাখবেন না। Free model availability guarantee নয়।</p><h3>Activity log · recent 100</h3><div id="auditLog"></div></section>`
  );
}
async function loadAudit() {
  const items = await D.history();
  if ($("auditLog"))
    $("auditLog").innerHTML =
      items
        .map(
          (x) =>
            `<div class="rowitem"><span class="sub">${esc(x.action)} · ${esc(x.kind || "records")} · ${esc(x.actor)}<br>${esc(x.at)}</span></div>`,
        )
        .join("") || empty("এখনও activity নেই।");
}
async function exportBackup() {
  const data = await D.backup();
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = `chhayapoth-backup-${today()}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
async function restoreBackup(input) {
  const f = input.files[0];
  if (!f) return;
  try {
    if (f.size > 15 * 1024 * 1024) throw new Error("Backup too large");
    if (
      !confirm(
        "Restore করলে বর্তমান shared records প্রতিস্থাপিত হবে। আগে backup নিয়েছেন?",
      )
    )
      return;
    const reminders = byKind("reminder").filter(
      (r) => r.notificationStatus === "scheduled",
    );
    if (reminders.length)
      throw new Error("আগে scheduled notification cancel করুন।");
    const value = JSON.parse(await f.text());
    for (const r of value.records || [])
      if (r.kind === "reminder") {
        r.notificationStatus = "not-scheduled";
        delete r.notificationId;
      }
    await D.restore(value);
    await render();
    toast("Backup restore হয়েছে। Reminder নতুন করে schedule করতে হবে।");
  } finally {
    input.value = "";
  }
}
function openModal(html) {
  $("modal").innerHTML =
    `<section class="modal-card" role="dialog" aria-modal="true" aria-label="Chhayapoth form"><div style="text-align:right"><button class="btn" onclick="closeModal()">বন্ধ ×</button></div>${html}</section>`;
  $("modal").classList.remove("hidden");
  $("modal").querySelector("input,button")?.focus();
}
function closeModal() {
  if (miniSession) {
    miniSession.stop().catch((e) => toast(e.message));
    miniSession = null;
  }
  $("modal").classList.add("hidden");
  $("modal").innerHTML = "";
}
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal();
});
$("modal").addEventListener("click", (e) => {
  if (e.target === $("modal")) closeModal();
});
// Nearby is wired only to the actual native transport. Web never simulates peers.
let nearbyReady = false,
  nearbyStarting = null,
  nearbyHandles = [],
  discovered = new Map(),
  connected = new Set(),
  approved = new Set(),
  selectedPeer = "",
  nearbyStatus = "বন্ধ";
function messages() {
  const ms = byKind("message")
    .filter((m) => !selectedPeer || m.peer === selectedPeer)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  return (
    head("কাছেই থাকুক কথাগুলো।", "NEARBY MESSAGING") +
    `<div class="notice" style="margin-bottom:20px">Bluetooth/BLE/Wi-Fi-ভিত্তিক কাছাকাছি যোগাযোগ। Internet messaging বা rescue-grade network নয়। Browser-এ discovery/send বন্ধ; বাস্তব device test এখনো প্রয়োজন।</div><div class="grid"><section class="card"><h3>Nearby devices</h3><p class="section-desc">${esc(nearbyStatus)}</p><div class="row"><button class="btn primary" onclick="startNearby('discover')">খুঁজুন</button><button class="btn" onclick="startNearby('advertise')">নিজেকে দৃশ্যমান করুন</button><button class="btn" onclick="stopNearby()">বন্ধ</button></div><div id="peers"></div></section><section class="card"><h3>Conversation</h3><div class="chat" style="min-height:230px;max-height:400px">${ms.map((m) => `<div class="bubble ${m.direction === "outgoing" ? "user" : ""}">${esc(m.body)}<br><small style="font-size:9px;opacity:.7">${esc(m.status)} · ${esc(m.peer)}</small></div>`).join("") || empty("সংযুক্ত device বেছে নিয়ে message লিখুন।")}</div><form class="command" onsubmit="event.preventDefault();sendMessage(this)"><input name="body" maxlength="2000" required aria-label="Message" placeholder="কথা লিখুন…"><button aria-label="Send">${ic("arrow")}</button></form></section></div>`
  );
}
async function initNearby() {
  if (!native())
    throw new Error("Nearby শুধু native Android/iOS build-এ। কোনো scan হয়নি।");
  if (nearbyReady) return;
  if (nearbyStarting) return nearbyStarting;
  nearbyStarting = (async () => {
    const n = NativeKit.nearby;
    await n.requestPermissions();
    await n.initialize({
      endpointName: "Chhayapoth",
      serviceID: "dev.chhayapoth.app",
      strategy: "pointToPoint",
      autoConnect: false,
    });
    const on = async (event, fn) =>
      nearbyHandles.push(
        await n.addListener(event, (v) =>
          Promise.resolve(fn(v)).catch((e) => toast(e.message)),
        ),
      );
    try {
      await on("onEndpointFound", (v) => {
        discovered.set(v.endpointID, v.endpointName || v.endpointID);
        renderPeers();
      });
      await on("onEndpointLost", (v) => {
        if (!connected.has(v.endpointID)) discovered.delete(v.endpointID);
        renderPeers();
      });
      await on("onEndpointInitiated", async (v) => {
        const token = String(v.authenticationToken || "");
        if (!token) {
          await n.rejectConnection({ endpointID: v.endpointID });
          throw new Error(
            "Authentication code নেই; connection প্রত্যাখ্যান করা হয়েছে।",
          );
        }
        if (
          confirm(
            `${v.endpointName || "Nearby device"}\nদুই device-এ একই code আছে কি?\n${token}\nশুধু মিললে Accept করুন।`,
          )
        ) {
          approved.add(v.endpointID);
          await n.acceptConnection({ endpointID: v.endpointID });
        } else {
          approved.delete(v.endpointID);
          await n.rejectConnection({ endpointID: v.endpointID });
        }
      });
      await on("onEndpointConnected", async (v) => {
        if (!approved.has(v.endpointID)) {
          await n.disconnect({ endpointID: v.endpointID });
          return;
        }
        connected.add(v.endpointID);
        discovered.set(v.endpointID, v.endpointName || v.endpointID);
        selectedPeer = v.endpointID;
        nearbyStatus = "সংযুক্ত";
        if (page === "messages") await render();
      });
      await on("onEndpointDisconnected", (v) => {
        connected.delete(v.endpointID);
        approved.delete(v.endpointID);
        nearbyStatus = "সংযোগ বিচ্ছিন্ন";
        renderPeers();
      });
      await on("onEndpointFailed", (v) => {
        connected.delete(v.endpointID);
        approved.delete(v.endpointID);
        toast("Connection ব্যর্থ হয়েছে।");
        renderPeers();
      });
      await on("onPayloadReceived", receivePayload);
      nearbyReady = true;
    } catch (e) {
      for (const h of nearbyHandles) await h.remove().catch(() => {});
      nearbyHandles = [];
      await n.reset().catch(() => {});
      throw e;
    }
  })();
  try {
    await nearbyStarting;
  } finally {
    nearbyStarting = null;
  }
}
async function startNearby(mode) {
  await initNearby();
  if (mode === "discover") await NativeKit.nearby.startDiscovery();
  else
    await NativeKit.nearby.startAdvertising({
      endpointName: "Chhayapoth",
      autoConnect: false,
    });
  nearbyStatus =
    mode === "discover" ? "খোঁজা হচ্ছে…" : "অন্য device-এর কাছে দৃশ্যমান";
  await render();
}
function renderPeers() {
  if (!$("peers")) return;
  const root = $("peers");
  root.replaceChildren();
  if (!native()) {
    root.textContent = "Web preview: native transport নেই।";
    return;
  }
  for (const [id, name] of discovered) {
    const row = document.createElement("div");
    row.className = "rowitem";
    const text = document.createElement("span");
    text.textContent =
      name + " · " + (connected.has(id) ? "connected" : "discovered");
    const button = document.createElement("button");
    button.className = "btn";
    button.textContent = connected.has(id) ? "বেছে নিন" : "Connect";
    button.onclick = async () => {
      try {
        selectedPeer = id;
        if (connected.has(id)) await render();
        else
          await NativeKit.nearby.requestConnection({
            endpointID: id,
            endpointName: "Chhayapoth",
          });
      } catch (e) {
        toast(e.message);
      }
    };
    row.append(text, button);
    root.append(row);
  }
}
async function stopNearby() {
  if (nearbyReady) await NativeKit.nearby.reset();
  for (const h of nearbyHandles) await h.remove().catch(() => {});
  nearbyHandles = [];
  nearbyReady = false;
  approved.clear();
  connected.clear();
  discovered.clear();
  selectedPeer = "";
  nearbyStatus = "বন্ধ";
  await render();
}
async function sendMessage(form) {
  if (!native() || !connected.has(selectedPeer))
    throw new Error("Verified connected device বেছে নিন।");
  const body = form.body.value.trim();
  if (!body) return;
  const peer = selectedPeer,
    id = crypto.randomUUID();
  let record = await D.create("message", {
    title: "Nearby message",
    body,
    peer,
    direction: "outgoing",
    status: "pending",
    messageId: id,
  });
  try {
    await NativeKit.nearby.sendPayload({
      endpointID: peer,
      payload: JSON.stringify({
        app: "chhayapoth",
        v: 1,
        type: "text",
        id,
        body,
      }),
    });
    const latest = (await D.list("message")).find((r) => r.id === record.id);
    if (latest.status === "pending")
      await D.update(latest.id, { status: "sent" }, latest.revision);
    form.reset();
  } catch (e) {
    const latest = (await D.list("message")).find((r) => r.id === record.id);
    if (latest.status !== "delivered")
      await D.update(latest.id, { status: "failed" }, latest.revision);
    throw e;
  } finally {
    if (page === "messages") await render();
  }
}
// Serialize receive processing to deduplicate repeated IDs before committing.
let incomingChain = Promise.resolve();
function receivePayload(event) {
  incomingChain = incomingChain
    .then(() => processPayload(event))
    .catch((e) => toast("Message rejected: " + e.message));
  return incomingChain;
}
async function processPayload(event) {
  const peer = event.endpointID;
  if (!connected.has(peer) || !approved.has(peer)) return;
  if (typeof event.payload !== "string" || event.payload.length > 18000) return;
  let packet;
  try {
    packet = JSON.parse(NativeKit.nearby.decodeBase64Utf8(event.payload));
  } catch {
    return;
  }
  if (
    packet.app !== "chhayapoth" ||
    packet.v !== 1 ||
    typeof packet.id !== "string" ||
    packet.id.length > 100
  )
    return;
  const records = await D.list("message");
  if (packet.type === "ack") {
    const m = records.find(
      (r) =>
        r.direction === "outgoing" &&
        r.peer === peer &&
        r.messageId === packet.id,
    );
    if (m && m.status !== "delivered")
      await D.update(m.id, { status: "delivered" }, m.revision);
  } else if (
    packet.type === "text" &&
    typeof packet.body === "string" &&
    packet.body.trim() &&
    packet.body.length <= 2000
  ) {
    if (
      !records.some(
        (r) =>
          r.direction === "incoming" &&
          r.peer === peer &&
          r.messageId === packet.id,
      )
    )
      await D.create("message", {
        title: "Nearby message",
        body: packet.body,
        peer,
        direction: "incoming",
        status: "received",
        messageId: packet.id,
      });
    await NativeKit.nearby.sendPayload({
      endpointID: peer,
      payload: JSON.stringify({
        app: "chhayapoth",
        v: 1,
        type: "ack",
        id: packet.id,
      }),
    });
  }
  if (page === "messages") await render();
}
// Changes made from agent.html share the same IndexedDB origin; reload on focus.
window.addEventListener("focus", () => render().catch((e) => toast(e.message)));
window.addEventListener("online", () => {
  $("networkState").textContent = "Online · local records retained";
});
window.addEventListener("offline", () => {
  $("networkState").textContent = "Offline · local utilities available";
});
if (localStorage.getItem("chhayapoth.theme") === "dark")
  document.body.classList.add("dark");
render().catch((e) => {
  $("content").textContent = "Storage unavailable: " + e.message;
});
