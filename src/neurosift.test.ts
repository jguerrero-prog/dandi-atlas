import { describe, expect, it } from "vitest";
import { neurosiftDandiset, neurosiftFile } from "./neurosift";

describe("Neurosift links", () => {
  it("opens a dandiset's page", () => {
    expect(neurosiftDandiset("000022")).toBe(
      "https://v3.neurosift.app/dandiset/000022",
    );
  });

  it("opens an NWB file from DANDI, in the format Neurosift's own links use", () => {
    expect(neurosiftFile("000022", "ac4bfefc")).toBe(
      "https://v3.neurosift.app/nwb?url=https://api.dandiarchive.org/api/assets/ac4bfefc/download/&dandisetId=000022&dandisetVersion=draft",
    );
  });
});
