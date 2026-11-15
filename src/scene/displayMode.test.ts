import { describe, expect, it } from "vitest";
import type { DandiRegion } from "../atlas/atlasData";
import {
  baseLook,
  decideDisplayMode,
  initialMeshIds,
  modeLook,
} from "./displayMode";
import { cameraFor } from "./views";

const region = (count: number): DandiRegion => ({
  acronym: "CP",
  name: "Caudoputamen",
  color_hex_triplet: "98D6F9",
  file_count: 1,
  dandiset_count: count,
  dandisets: [],
});

describe("decideDisplayMode", () => {
  const allen = {
    rootId: 997,
    coordSystem: "allen" as const,
    activeIds: new Set([672]),
    roiIds: new Set([10]),
  };
  const ras = { ...allen, rootId: 9999, coordSystem: "ras" as const };

  it("keeps the Allen outline as glass whatever is selected", () => {
    expect(
      decideDisplayMode(997, { ...allen, activeIds: new Set([997]) }),
    ).toBe("glass");
  });

  it("spotlights active regions, softens extra regions and hides the rest", () => {
    expect(decideDisplayMode(672, allen)).toBe("active");
    expect(decideDisplayMode(10, allen)).toBe("roi");
    expect(decideDisplayMode(5, allen)).toBe("hidden");
  });

  it("draws other atlases' outline as a silhouette unless it is the focus", () => {
    expect(decideDisplayMode(9999, ras)).toBe("silhouette");
    expect(
      decideDisplayMode(9999, { ...ras, activeIds: new Set([9999]) }),
    ).toBe("active");
  });
});

describe("baseLook", () => {
  it("makes regions covered by more dandisets more opaque, up to 0.9", () => {
    const few = baseLook({
      isRoot: false,
      region: region(1),
      coordSystem: "allen",
      rootOpacity: 0.06,
    });
    const many = baseLook({
      isRoot: false,
      region: region(500),
      coordSystem: "allen",
      rootOpacity: 0.06,
    });
    expect(few.opacity).toBeCloseTo(0.5);
    expect(many.opacity).toBe(0.9);
    expect(few.color).toBe(0x98d6f9);
  });

  it("draws regions without data as faint context: wireframe on Allen, solid elsewhere", () => {
    expect(
      baseLook({ isRoot: false, coordSystem: "allen", rootOpacity: 0.06 }),
    ).toMatchObject({
      wireframe: true,
      opacity: 0.05,
    });
    expect(
      baseLook({ isRoot: false, coordSystem: "ras", rootOpacity: 0.3 }),
    ).toMatchObject({
      wireframe: false,
      opacity: 0.15,
    });
  });

  it("lets the outline follow the view's theme", () => {
    expect(
      baseLook({ isRoot: true, coordSystem: "allen", rootOpacity: 0.06 }),
    ).toMatchObject({
      themed: true,
      opacity: 0.06,
    });
  });
});

describe("modeLook", () => {
  const base = {
    color: 0,
    opacity: 0.06,
    wireframe: false,
    doubleSided: false,
    depthWrite: false,
  };

  it("uses the Regions opacity for active meshes and writes depth only when opaque", () => {
    expect(modeLook("active", base, 1)).toMatchObject({
      visible: true,
      transparent: false,
      depthWrite: true,
    });
    expect(modeLook("active", base, 0.4)).toMatchObject({
      opacity: 0.4,
      transparent: true,
      depthWrite: false,
    });
  });

  it("scales the glass outline and draws extra regions at about a third", () => {
    expect(modeLook("glass", base, 0.5).opacity).toBeCloseTo(0.03);
    expect(modeLook("roi", base, 1).opacity).toBeCloseTo(0.35);
  });

  it("hides everything at zero opacity except the silhouette", () => {
    expect(modeLook("active", base, 0).visible).toBe(false);
    expect(modeLook("silhouette", base, 0).visible).toBe(true);
  });
});

describe("initialMeshIds", () => {
  const manifest = {
    root_id: 1,
    data_structures: [1, 2, 3],
    all_meshes: [1, 2, 3, 4, 5],
    no_mesh: [3],
  };

  it("loads only regions with data on Allen, and every mesh elsewhere, never the outline or missing meshes", () => {
    expect(initialMeshIds(manifest, "allen")).toEqual([2]);
    expect(initialMeshIds(manifest, "ras")).toEqual([2, 4, 5]);
  });
});

describe("cameraFor", () => {
  it("looks down from above in each coordinate system", () => {
    expect(cameraFor("dorsal", "ras", [0, 0, 0], 200)).toEqual({
      position: [0, 0, 200],
      up: [0, 1, 0],
    });
    expect(cameraFor("dorsal", "allen", [10, 20, 30], 100)).toEqual({
      position: [10, -80, 30],
      up: [-1, 0, 0],
    });
  });
});
