/** Shared, validated IndexedDB domain for the UI and the native agent tools. */
export const KINDS = [
  "event",
  "habit",
  "ledger",
  "reminder",
  "widget",
  "note",
  "quiz",
  "message",
] as const;
export type Kind = (typeof KINDS)[number];
export type Item = {
  id: string;
  kind: Kind;
  revision: number;
  createdAt: string;
  updatedAt: string;
  [key: string]: unknown;
};
const DB_NAME = "chhayapoth-domain-v1";
const safeText = (v: unknown, max = 160) => {
  if (typeof v !== "string" || !v.trim() || v.length > max)
    throw new Error(`Text required (1–${max} characters)`);
  return v.trim();
};
const date = (v: unknown) => {
  const s = safeText(v, 10);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(s) ||
    new Date(s + "T00:00:00Z").toISOString().slice(0, 10) !== s
  )
    throw new Error("Invalid calendar date");
  return s;
};
const instant = (v: unknown) => {
  const s = safeText(v, 40);
  if (!/T/.test(s) || !Number.isFinite(Date.parse(s)))
    throw new Error("A valid date and time is required");
  return new Date(s).toISOString();
};
export function validate(
  kind: Kind,
  input: Record<string, unknown>,
): Record<string, unknown> {
  if (!KINDS.includes(kind)) throw new Error("Unknown record type");
  const d: Record<string, unknown> = {};
  if (kind === "event" || kind === "reminder") {
    d.title = safeText(input.title);
    d.at = instant(input.at);
    d.note = typeof input.note === "string" ? input.note.slice(0, 500) : "";
  }
  if (kind === "reminder") {
    d.notificationStatus = ["not-scheduled", "scheduled", "failed"].includes(
      String(input.notificationStatus),
    )
      ? input.notificationStatus
      : "not-scheduled";
    if (input.notificationId !== undefined) {
      if (
        !Number.isInteger(input.notificationId) ||
        Number(input.notificationId) < 1
      )
        throw new Error("Invalid notification ID");
      d.notificationId = input.notificationId;
    }
  }
  if (kind === "habit") {
    d.title = safeText(input.title, 80);
    const logs = input.logs ?? [];
    if (!Array.isArray(logs) || logs.length > 4000)
      throw new Error("Invalid habit history");
    d.logs = [...new Set(logs.map(date))];
  }
  if (kind === "ledger") {
    const n = input.amountMinor;
    if (!Number.isSafeInteger(n) || Number(n) <= 0 || Number(n) > 1e12)
      throw new Error("Amount must be a positive, exact minor-unit integer");
    if (!["income", "expense"].includes(String(input.type)))
      throw new Error("Choose income or expense");
    d.amountMinor = n;
    d.type = input.type;
    d.date = date(input.date);
    d.title = safeText(input.title, 120);
    d.category = safeText(input.category ?? "General", 40);
    d.currency = "BDT";
  }
  if (kind === "widget") {
    if (
      !["agenda", "habits", "ledger", "notes", "focus"].includes(
        String(input.template),
      )
    )
      throw new Error("Unknown widget template");
    d.template = input.template;
    d.title = safeText(input.title, 80);
    d.order =
      Number.isInteger(input.order) && Number(input.order) >= 0
        ? input.order
        : 0;
  }
  if (kind === "note") {
    d.title = safeText(input.title, 100);
    d.body = typeof input.body === "string" ? input.body.slice(0, 10000) : "";
  }
  if (kind === "quiz") {
    d.title = safeText(input.title, 100);
    if (
      !Number.isInteger(input.correct) ||
      Number(input.correct) < 0 ||
      Number(input.correct) > 3
    )
      throw new Error("Invalid score");
    d.correct = input.correct;
    d.total = 3;
  }
  if (kind === "message") {
    d.title = safeText(input.title, 100);
    d.body = safeText(input.body, 2000);
    d.peer = safeText(input.peer, 100);
    if (!["incoming", "outgoing"].includes(String(input.direction)))
      throw new Error("Invalid direction");
    d.direction = input.direction;
    d.status = ["received", "pending", "sent", "delivered", "failed"].includes(
      String(input.status),
    )
      ? input.status
      : "pending";
    d.messageId = safeText(input.messageId, 100);
  }
  return d;
}
export function parseMoney(value: string): number {
  if (!/^\d{1,10}(\.\d{1,2})?$/.test(value))
    throw new Error("Use a positive amount with at most two decimal places");
  const [a, b = ""] = value.split(".");
  const n = Number(a) * 100 + Number(b.padEnd(2, "0"));
  if (n <= 0 || !Number.isSafeInteger(n)) throw new Error("Invalid amount");
  return n;
}
function req<T>(r: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}
function done(t: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    t.oncomplete = () => resolve();
    t.onabort = t.onerror = () =>
      reject(t.error ?? new Error("Storage operation failed"));
  });
}
export class Domain {
  private promise?: Promise<IDBDatabase>;
  constructor(private name = DB_NAME) {}
  async db() {
    if (!this.promise)
      this.promise = new Promise((resolve, reject) => {
        const r = indexedDB.open(this.name, 1);
        r.onupgradeneeded = () => {
          r.result.createObjectStore("records", { keyPath: "id" });
          r.result.createObjectStore("audit", {
            keyPath: "seq",
            autoIncrement: true,
          });
        };
        r.onerror = () => reject(r.error);
        r.onsuccess = () => {
          r.result.onversionchange = () => {
            r.result.close();
            this.promise = undefined;
          };
          resolve(r.result);
        };
        r.onblocked = () =>
          reject(new Error("Close other app tabs to upgrade storage"));
      });
    return this.promise;
  }
  async list(kind?: Kind): Promise<Item[]> {
    const db = await this.db();
    const rows = (await req(
      db.transaction("records").objectStore("records").getAll(),
    )) as Item[];
    return rows
      .filter((r) => !kind || r.kind === kind)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }
  async create(
    kind: Kind,
    data: Record<string, unknown>,
    actor = "user",
  ): Promise<Item> {
    const fields = validate(kind, data);
    const now = new Date().toISOString();
    const item = {
      ...fields,
      id: crypto.randomUUID(),
      kind,
      revision: 1,
      createdAt: now,
      updatedAt: now,
    } as Item;
    const db = await this.db();
    const t = db.transaction(["records", "audit"], "readwrite");
    const complete = done(t);
    t.objectStore("records").add(item);
    t.objectStore("audit").add({
      action: "create",
      id: item.id,
      kind,
      actor,
      at: now,
    });
    await complete;
    this.changed();
    return item;
  }
  async update(
    id: string,
    patch: Record<string, unknown>,
    expectedRevision: number,
    actor = "user",
  ): Promise<Item> {
    const db = await this.db();
    const t = db.transaction(["records", "audit"], "readwrite");
    const complete = done(t);
    try {
      const old = (await req(t.objectStore("records").get(id))) as
        | Item
        | undefined;
      if (!old) throw new Error("Record not found");
      if (old.revision !== expectedRevision)
        throw new Error("This record changed. Refresh and try again.");
      const item = {
        ...validate(old.kind, { ...old, ...patch }),
        id,
        kind: old.kind,
        createdAt: old.createdAt,
        updatedAt: new Date().toISOString(),
        revision: old.revision + 1,
      } as Item;
      t.objectStore("records").put(item);
      t.objectStore("audit").add({
        action: "update",
        id,
        kind: old.kind,
        actor,
        at: item.updatedAt,
      });
      await complete;
      this.changed();
      return item;
    } catch (e) {
      try {
        t.abort();
      } catch {}
      await complete.catch(() => {});
      throw e;
    }
  }
  async remove(id: string, expectedRevision: number, actor = "user") {
    const db = await this.db();
    const t = db.transaction(["records", "audit"], "readwrite");
    const complete = done(t);
    try {
      const old = (await req(t.objectStore("records").get(id))) as
        | Item
        | undefined;
      if (!old || old.revision !== expectedRevision)
        throw new Error("Record missing or changed; refresh first");
      t.objectStore("records").delete(id);
      t.objectStore("audit").add({
        action: "delete",
        id,
        kind: old.kind,
        actor,
        at: new Date().toISOString(),
      });
      await complete;
      this.changed();
    } catch (e) {
      try {
        t.abort();
      } catch {}
      await complete.catch(() => {});
      throw e;
    }
  }
  async history() {
    const db = await this.db();
    return (await req(db.transaction("audit").objectStore("audit").getAll()))
      .slice(-100)
      .reverse();
  }
  async backup() {
    return {
      format: "chhayapoth-backup",
      version: 1,
      exportedAt: new Date().toISOString(),
      records: await this.list(),
    };
  }
  async restore(value: unknown) {
    const b = value as any;
    if (
      !b ||
      b.format !== "chhayapoth-backup" ||
      b.version !== 1 ||
      !Array.isArray(b.records) ||
      b.records.length > 10000
    )
      throw new Error("Invalid backup");
    const seen = new Set<string>();
    const rows = b.records.map((r: any) => {
      if (
        !r ||
        typeof r.id !== "string" ||
        !r.id ||
        r.id.length > 100 ||
        seen.has(r.id)
      )
        throw new Error("Invalid or duplicate record ID");
      seen.add(r.id);
      if (!Number.isInteger(r.revision) || r.revision < 1)
        throw new Error("Invalid revision");
      return {
        ...validate(r.kind, r),
        id: r.id,
        kind: r.kind,
        revision: r.revision,
        createdAt: instant(r.createdAt),
        updatedAt: instant(r.updatedAt),
      };
    });
    const db = await this.db();
    const t = db.transaction(["records", "audit"], "readwrite");
    const complete = done(t);
    t.objectStore("records").clear();
    rows.forEach((r: any) => t.objectStore("records").add(r));
    t.objectStore("audit").add({
      action: "restore",
      count: rows.length,
      actor: "user",
      at: new Date().toISOString(),
    });
    await complete;
    this.changed();
  }
  private changed() {
    if (typeof window !== "undefined")
      window.dispatchEvent(new Event("chhayapoth:changed"));
  }
}
export const domain = new Domain();
