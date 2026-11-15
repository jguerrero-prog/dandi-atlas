import { describe, expect, it } from "vitest";
import type { AtlasData, Structure } from "../atlas/atlasData";
import type { Asset } from "./dandisetData";
import { groupSubjects } from "./dandisetModel";
import { dandisetView } from "./dandisetView";

const cp: Structure = {
  id: 672,
  name: "Caudoputamen",
  acronym: "CP",
  parent_structure_id: 477,
};
const str: Structure = {
  id: 477,
  name: "Striatum",
  acronym: "STR",
  parent_structure_id: 997,
  children: [cp],
};
const visp: Structure = {
  id: 385,
  name: "Primary visual area",
  acronym: "VISp",
  parent_structure_id: 997,
};
const root: Structure = {
  id: 997,
  name: "Whole brain",
  acronym: "root",
  parent_structure_id: null,
  children: [str, visp],
};
const data: AtlasData = {
  key: "allen_ccf",
  roots: [root],
  structures: new Map([root, str, cp, visp].map((node) => [node.id, node])),
  regions: new Map(),
  manifest: { root_id: 997, data_structures: [672, 385] },
  dandisetRegions: new Map([["000017", [672, 385]]]),
  electrodeDandisets: new Set(["000017"]),
  version: "1",
};

const asset = (
  id: string,
  subject: string,
  session: string,
  regions: number[],
): Asset => ({
  path: `${subject}/${subject}_ses-${session}.nwb`,
  asset_id: id,
  regions: regions.map((region) => ({ id: region })),
  session,
});
const subjects = groupSubjects([
  asset("a1", "sub-Cori", "1", [672]),
  asset("a2", "sub-Cori", "2", [672, 385]),
  asset("b1", "sub-Hench", "1", [385]),
]);
const electrodes = new Map([
  [
    "a1",
    [
      [100, 200, 300] as [number, number, number],
      [0, 0, 0] as [number, number, number],
    ],
  ],
  ["a2", [[110, 210, 310] as [number, number, number]]],
]);
const base = {
  data,
  coordSystem: "ras" as const,
  dandiset: "000017",
  subjects,
  electrodes,
  hidden: new Set<number>(),
  sessionColors: ["#red", "#blue"],
};

describe("dandisetView", () => {
  it("spotlights every region of the dandiset and draws no electrodes until a subject is chosen", () => {
    const view = dandisetView(base);
    expect(view.focusIds).toEqual([672, 385]);
    expect(view.shown.map((s) => s.name)).toEqual(["Cori", "Hench"]);
    expect(view.electrodes).toEqual([]);
  });

  it("narrows subjects and regions to a region filter, including its subregions", () => {
    const view = dandisetView({ ...base, regionFilter: 477 });
    expect(view.shown.map((s) => s.name)).toEqual(["Cori"]);
    expect(view.focusIds).toEqual([672]);
  });

  it("draws a subject's electrodes in one color per session, skipping unknown positions", () => {
    const view = dandisetView({ ...base, subjectDir: "sub-Cori" });
    expect(view.focusIds.toSorted((a, b) => a - b)).toEqual([385, 672]);
    expect(view.electrodes.map((point) => point.color)).toEqual([
      "#red",
      "#blue",
    ]);
    expect(view.electrodes[0]).toMatchObject({
      coord: [100, 200, 300],
      label: "Electrode 1 · 1",
    });
  });

  it("draws one session's electrodes in the electrode color", () => {
    const view = dandisetView({
      ...base,
      subjectDir: "sub-Cori",
      sessionId: "a2",
    });
    expect(view.focusIds).toEqual([672, 385]);
    expect(view.electrodes).toEqual([
      { coord: [110, 210, 310], label: "Electrode 1 · 2", color: undefined },
    ]);
  });

  it("finds the subject from the file alone, as Neurosift's links name it", () => {
    const view = dandisetView({ ...base, sessionId: "b1" });
    expect(view.subject?.name).toBe("Hench");
    expect(view.session?.asset_id).toBe("b1");
  });

  it("leaves hidden regions out of the spotlight but keeps them in the list", () => {
    const view = dandisetView({ ...base, hidden: new Set([385]) });
    expect(view.regionIds).toEqual([672, 385]);
    expect(view.focusIds).toEqual([672]);
  });
});
