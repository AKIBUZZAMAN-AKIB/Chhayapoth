import "fake-indexeddb/auto";
import { describe, it, expect } from "vitest";
import {
  createDeviceToolsTransport,
  defaultDeviceToolDeps,
} from "../bridge/device-tools";
import { domain } from "../bridge/chhayapoth/domain";
const transport = createDeviceToolsTransport(defaultDeviceToolDeps(), {
  platform: "web",
});
async function call(name: string, args: Record<string, unknown>) {
  const response = await transport.send({
    jsonrpc: "2.0",
    id: 1,
    method: "tools/call",
    params: { name, arguments: args },
  });
  return response?.result as any;
}
describe("agent tools use the same persistent domain", () => {
  it("saves a real event rather than claiming a notification", async () => {
    const result = await call("chhayapoth_create", {
      kind: "event",
      data: { title: "Agent study", at: "2026-12-02T10:00:00Z" },
    });
    expect(result.isError).not.toBe(true);
    expect(
      (await domain.list("event")).some((x) => x.title === "Agent study"),
    ).toBe(true);
  });
  it("rejects medical reminder access", async () => {
    const result = await call("chhayapoth_list", { kind: "reminder" });
    expect(result.isError).toBe(true);
  });
  it("rejects fractional paisa through the agent path", async () => {
    const result = await call("chhayapoth_create", {
      kind: "ledger",
      data: {
        title: "Bad",
        amountMinor: 2.2,
        type: "expense",
        date: "2026-11-02",
      },
    });
    expect(result.isError).toBe(true);
  });
  it("updates only with an authoritative revision", async () => {
    const item = await domain.create("note", { title: "First" });
    const bad = await call("chhayapoth_update", {
      id: item.id,
      revision: 8,
      patch: { title: "Wrong" },
    });
    expect(bad.isError).toBe(true);
    const ok = await call("chhayapoth_update", {
      id: item.id,
      revision: 1,
      patch: { title: "Updated" },
    });
    expect(ok.isError).not.toBe(true);
    expect(
      (await domain.list("note")).find((x) => x.id === item.id)?.title,
    ).toBe("Updated");
  });
});
