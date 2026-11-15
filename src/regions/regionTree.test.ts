import { describe, expect, it } from "vitest";
import type { TreeNode } from "@ui";
import type { AtlasData, DandiRegion, Structure } from "../atlas/atlasData";
import { ancestorsOf, buildRegionTree, regionHint } from "./regionTree";

const s = (
  id: number,
  name: string,
  acronym: string,
  parent: number | null,
  children: Structure[] = [],
): Structure => ({
  id,
  name,
  acronym,
  parent_structure_id: parent,
  color_hex_triplet: "98D6F9",
  children,
});
const r = (
  name: string,
  acronym: string,
  files: number,
  dandisets: number,
): DandiRegion => ({
  name,
  acronym,
  file_count: files,
  dandiset_count: dandisets,
  dandisets: [],
});

const cp = s(672, "Caudoputamen", "CP", 477);
const ls = s(242, "Lateral septal nucleus", "LS", 477);
const str = s(477, "Striatum", "STR", 997, [cp, ls]);
const vs = s(73, "ventricular systems", "VS", 997);
const root = s(997, "Whole brain", "root", null, [str, vs]);
const data: AtlasData = {
  key: "allen_ccf",
  roots: [root],
  structures: new Map([root, str, cp, ls, vs].map((node) => [node.id, node])),
  regions: new Map([
    [
      997,
      {
        ...r("Whole brain", "root", 0, 0),
        total_file_count: 400,
        total_dandiset_count: 13,
      },
    ],
    [
      477,
      {
        ...r("Striatum", "STR", 0, 0),
        total_file_count: 400,
        total_dandiset_count: 13,
      },
    ],
    [672, r("Caudoputamen", "CP", 395, 12)],
    [242, r("Lateral septal nucleus", "LS", 5, 1)],
  ]),
  manifest: { root_id: 997, data_structures: [672, 242] },
  dandisetRegions: new Map(),
  electrodeDandisets: new Set(),
  version: "1",
};

const names = (nodes: TreeNode[]): string[] =>
  nodes.flatMap((node) => [node.name, ...names(node.children ?? [])]);

describe("buildRegionTree", () => {
  const none = new Set<number>();

  it("hides regions without DANDI data unless asked for", () => {
    expect(
      names(
        buildRegionTree(data, { query: "", showEmpty: false, keep: none })
          .nodes,
      ),
    ).toEqual([
      "Whole brain",
      "Striatum",
      "Caudoputamen",
      "Lateral septal nucleus",
    ]);
    expect(
      names(
        buildRegionTree(data, { query: "", showEmpty: true, keep: none }).nodes,
      ),
    ).toContain("ventricular systems");
  });

  it("gives each row its color, count and a hint that says what the count means", () => {
    const [whole] = buildRegionTree(data, {
      query: "",
      showEmpty: false,
      keep: none,
    }).nodes;
    const caudoputamen = whole.children![0].children![0];
    expect(caudoputamen).toMatchObject({
      id: "672",
      kind: "file",
      size: "12",
      swatch: "#98D6F9",
    });
    expect(caudoputamen.hint).toBe(
      "Caudoputamen (CP): 12 dandisets, 395 files",
    );
  });

  it("searches names and acronyms, keeping the path to each match open", () => {
    const tree = buildRegionTree(data, {
      query: "cp",
      showEmpty: false,
      keep: none,
    });
    expect(names(tree.nodes)).toEqual([
      "Whole brain",
      "Striatum",
      "Caudoputamen",
    ]);
    expect(tree.matches).toBe(1);
    expect(tree.open).toEqual(expect.arrayContaining(["997", "477"]));
  });

  it("keeps the selection in view while searching for something else", () => {
    const tree = buildRegionTree(data, {
      query: "lateral",
      showEmpty: false,
      keep: new Set([672]),
    });
    expect(names(tree.nodes)).toEqual([
      "Whole brain",
      "Striatum",
      "Caudoputamen",
      "Lateral septal nucleus",
    ]);
    expect(tree.matches).toBe(1);
  });
});

describe("region helpers", () => {
  it("walks up to the root", () => {
    expect(ancestorsOf(data, 672)).toEqual([997, 477]);
  });

  it("says plainly when a region has no data, and drops the Allen root's acronym", () => {
    expect(regionHint(data, 73)).toBe(
      "ventricular systems (VS): no DANDI data",
    );
    expect(regionHint(data, 997)).toBe("Whole brain: 13 dandisets, 400 files");
  });
});
