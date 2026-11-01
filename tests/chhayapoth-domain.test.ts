import "fake-indexeddb/auto";
import { describe, it, expect } from "vitest";
import { Domain, parseMoney, validate } from "../bridge/chhayapoth/domain";
const db = () => new Domain("test-" + crypto.randomUUID());
describe("Chhayapoth money", () => {
  it("uses integer minor units", () => {
    expect(parseMoney("450.05")).toBe(45005);
    expect(parseMoney("0.10")).toBe(10);
  });
  it.each(["-1", "0", "1.234", "NaN", "1e5", "", "2,000"])(
    "rejects invalid amount %s",
    (v) => expect(() => parseMoney(v)).toThrow(),
  );
});
describe("Chhayapoth domain", () => {
  it("creates and reloads persisted records", async () => {
    const d = db();
    const row = await d.create("event", {
      title: "Study",
      at: "2026-11-05T10:00:00+06:00",
    });
    expect((await d.list("event"))[0].id).toBe(row.id);
    expect(row.at).toBe("2026-11-05T04:00:00.000Z");
  });
  it("rejects impossible date-only values", () =>
    expect(() =>
      validate("ledger", {
        title: "x",
        amountMinor: 100,
        type: "expense",
        date: "2026-02-30",
      }),
    ).toThrow());
  it("rejects unsupported record kinds", () =>
    expect(() => validate("shell" as any, {})).toThrow());
  it("discards unknown privileged fields", () =>
    expect(validate("note", { title: "x", body: "ok", admin: true })).toEqual({
      title: "x",
      body: "ok",
    }));
  it("guards revisions and preserves data on failure", async () => {
    const d = db(),
      r = await d.create("habit", { title: "Walk" });
    await d.update(r.id, { logs: ["2026-11-02"] }, 1);
    await expect(d.update(r.id, { title: "Overwrite" }, 1)).rejects.toThrow(
      "changed",
    );
    expect((await d.list())[0].title).toBe("Walk");
  });
  it("rejects invalid edits atomically", async () => {
    const d = db(),
      r = await d.create("ledger", {
        title: "Rice",
        amountMinor: 101,
        type: "expense",
        date: "2026-11-02",
      });
    await expect(d.update(r.id, { amountMinor: 1.1 }, 1)).rejects.toThrow();
    expect((await d.list())[0].amountMinor).toBe(101);
  });
  it("logs only operation metadata, not sensitive content", async () => {
    const d = db();
    await d.create("note", { title: "Private", body: "SECRET" });
    expect(JSON.stringify(await d.history())).not.toContain("SECRET");
  });
  it("restores a backup and rejects malformed backups without deleting data", async () => {
    const d = db();
    await d.create("note", { title: "Original", body: "A" });
    const b = await d.backup();
    await d.create("note", { title: "Second" });
    await d.restore(b);
    expect(await d.list()).toHaveLength(1);
    await expect(
      d.restore({ ...b, records: [...b.records, { ...b.records[0] }] }),
    ).rejects.toThrow("duplicate");
    expect(await d.list()).toHaveLength(1);
  });
  it("requires current revision for delete", async () => {
    const d = db(),
      r = await d.create("note", { title: "Delete" });
    await expect(d.remove(r.id, 8)).rejects.toThrow();
    expect(await d.list()).toHaveLength(1);
    await d.remove(r.id, 1);
    expect(await d.list()).toHaveLength(0);
  });
  it("deduplicates habit day keys", () =>
    expect(
      validate("habit", { title: "Walk", logs: ["2026-11-02", "2026-11-02"] })
        .logs,
    ).toEqual(["2026-11-02"]));
  it("restricts widgets to declarative templates", () =>
    expect(() =>
      validate("widget", { title: "x", template: "<script>" }),
    ).toThrow());
  it("round-trips all supported record domains", async () => {
    const d = db();
    await d.create("habit", { title: "Read" });
    await d.create("ledger", {
      title: "Wage",
      amountMinor: 100000,
      type: "income",
      date: "2026-11-02",
    });
    await d.create("widget", { title: "Focus", template: "focus" });
    await d.create("reminder", {
      title: "Appointment",
      at: "2026-12-01T10:00:00Z",
    });
    await d.create("quiz", { title: "Algebra", correct: 2 });
    await d.create("message", {
      title: "Nearby",
      body: "Hi",
      peer: "X",
      direction: "incoming",
      status: "received",
      messageId: "m1",
    });
    const b = await d.backup();
    await d.restore(b);
    expect(await d.list()).toHaveLength(6);
  });
});
