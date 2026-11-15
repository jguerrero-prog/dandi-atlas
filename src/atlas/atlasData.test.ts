import { afterEach, describe, expect, it, vi } from "vitest";
import { loadAtlasData, regionTotals, type DandiRegion } from "./atlasData";

const regions: Record<string, DandiRegion> = {
  "997": {
    acronym: "root",
    name: "root",
    file_count: 0,
    dandiset_count: 0,
    dandisets: [],
    total_file_count: 395,
    total_dandiset_count: 12,
  },
  "672": {
    acronym: "CP",
    name: "Caudoputamen",
    file_count: 395,
    dandiset_count: 12,
    dandisets: ["000017"],
  },
};

const files: Record<string, unknown> = {
  "structure_graph.json": [
    {
      id: 997,
      acronym: "root",
      name: "root",
      parent_structure_id: null,
      children: [
        {
          id: 672,
          acronym: "CP",
          name: "Caudoputamen",
          parent_structure_id: 997,
        },
      ],
    },
  ],
  "dandi_regions.json": regions,
  "mesh_manifest.json": { root_id: 997, data_structures: [672] },
};

afterEach(() => vi.unstubAllGlobals());

describe("loadAtlasData", () => {
  it("indexes every structure and region, and names the Allen root in plain words", async () => {
    const requested: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        requested.push(url);
        const name = url.split("/").pop()!.split("?")[0];
        return new Response(JSON.stringify(files[name]));
      }),
    );
    const data = await loadAtlasData("allen_ccf", "20261115031249");
    expect(data.structures.get(672)?.name).toBe("Caudoputamen");
    expect(data.structures.get(997)?.name).toBe("Whole brain");
    expect(data.regions.get(997)?.name).toBe("Whole brain");
    expect(
      requested.every(
        (url) =>
          url.includes("/data/atlases/allen_ccf/") &&
          url.endsWith("?v=20261115031249"),
      ),
    ).toBe(true);
  });

  it("rejects a file in the wrong shape and names it", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async (url: string) =>
          new Response(
            JSON.stringify(
              url.includes("mesh_manifest")
                ? { root: 1 }
                : files[url.split("/").pop()!.split("?")[0]],
            ),
          ),
      ),
    );
    await expect(loadAtlasData("allen_ccf", "1")).rejects.toThrow(
      "mesh_manifest.json",
    );
  });
});

describe("regionTotals", () => {
  it("prefers totals that include descendants", () => {
    expect(regionTotals(regions["997"])).toEqual({ dandisets: 12, files: 395 });
    expect(regionTotals(regions["672"])).toEqual({ dandisets: 12, files: 395 });
  });
});
