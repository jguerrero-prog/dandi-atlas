import { describe, expect, it } from "vitest";
import type { AtlasData, Structure } from "../atlas/atlasData";
import type { Asset } from "./dandisetData";
import {
  drawableCoords,
  groupSubjects,
  sessionName,
  sessionNames,
  subjectCounts,
  subjectsInRegion,
} from "./dandisetModel";

const asset = (path: string, regions: number[], session?: string): Asset => ({
  path,
  asset_id: path,
  regions: regions.map((id) => ({ id })),
  session,
});

const ASSETS = [
  asset("sub-10/sub-10_ses-2.nwb", [672], "2"),
  asset(
    "sub-2/sub-2_ses-20161214T123456_behavior+ecephys.nwb",
    [672, 385],
    "20161214T123456",
  ),
  asset("sub-2/sub-2_ses-1.nwb", [242], "1"),
  asset("sub-Cori_ecephys.nwb", [385]),
];

describe("groupSubjects", () => {
  it("groups files by subject folder in natural order and merges their regions", () => {
    const subjects = groupSubjects(ASSETS);
    expect(subjects.map((subject) => subject.name)).toEqual([
      "2",
      "10",
      "Cori",
    ]);
    expect([...subjects[0].regionIds].toSorted((a, b) => a - b)).toEqual([
      242, 385, 672,
    ]);
    expect(subjects[0].assets.map((a) => a.session)).toEqual([
      "1",
      "20161214T123456",
    ]);
    expect(subjects[2].dir).toBe("sub-Cori");
  });

  it("counts subjects per region", () => {
    expect(subjectCounts(groupSubjects(ASSETS)).get(672)).toBe(2);
  });
});

describe("subjectsInRegion", () => {
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
    parent_structure_id: null,
    children: [cp],
  };
  const data: AtlasData = {
    key: "allen_ccf",
    roots: [str],
    structures: new Map([
      [477, str],
      [672, cp],
    ]),
    regions: new Map(),
    manifest: { root_id: 477, data_structures: [] },
    dandisetRegions: new Map(),
    electrodeDandisets: new Set(),
    version: "1",
  };

  it("keeps subjects recording in the region or below it", () => {
    expect(
      subjectsInRegion(data, groupSubjects(ASSETS), 477).map((s) => s.name),
    ).toEqual(["2", "10"]);
  });
});

describe("sessionName", () => {
  it("reads a session id that starts with a date and time, and says what kind of file it is", () => {
    expect(sessionName(ASSETS[1])).toEqual({
      label: "Dec 14, 2016, 12:34 (processed)",
      hint: "Session 20161214T123456\nsub-2/sub-2_ses-20161214T123456_behavior+ecephys.nwb",
    });
  });

  it("keeps other ids, and falls back to the file name", () => {
    expect(sessionName(ASSETS[0]).label).toBe("2");
    expect(sessionName(ASSETS[3]).label).toBe("sub-Cori_ecephys.nwb");
  });
});

describe("sessionNames", () => {
  it("tells apart files that share a session, such as one per probe", () => {
    const files = [
      asset("sub-7/sub-7_ses-766640955.nwb", [1], "766640955"),
      asset(
        "sub-7/sub-7_ses-766640955_probe-773592315_ecephys.nwb",
        [1],
        "766640955",
      ),
      asset("sub-7/sub-7_ses-2.nwb", [1], "2"),
    ];
    expect([...sessionNames(files).values()].map((name) => name.label)).toEqual(
      ["766640955 · main file", "766640955 · probe-773592315 ecephys", "2"],
    );
  });
});

describe("drawableCoords", () => {
  it("drops unknown positions", () => {
    expect(
      drawableCoords(
        [
          [0, 0, 0],
          [-1, -1, -1],
          [1, 2, 3],
        ],
        "ras",
      ),
    ).toEqual([[1, 2, 3]]);
  });

  it("scales Allen coordinates stored in 10 µm voxels to micrometres", () => {
    expect(drawableCoords([[657.5, 352.5, 482.5]], "allen")).toEqual([
      [6575, 3525, 4825],
    ]);
    expect(drawableCoords([[6575, 3525, 4825]], "allen")).toEqual([
      [6575, 3525, 4825],
    ]);
  });
});
