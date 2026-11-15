import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchLastUpdated } from "./fetchData";

const respond = (body: unknown, status = 200) =>
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(body), { status })));

afterEach(() => vi.unstubAllGlobals());

describe("fetchData", () => {
  it("returns a file in the expected shape", async () => {
    respond({ timestamp: "2026-11-15T03:12:49Z", mode: "incremental" });
    await expect(fetchLastUpdated()).resolves.toMatchObject({ timestamp: "2026-11-15T03:12:49Z" });
  });

  it("names the file when the request fails", async () => {
    respond({}, 404);
    await expect(fetchLastUpdated()).rejects.toThrow("Couldn't load last_updated.json (404)");
  });

  it("names the file when its shape is wrong", async () => {
    respond({ timestamp: 3 });
    await expect(fetchLastUpdated()).rejects.toThrow("last_updated.json isn't in the expected format");
  });
});
