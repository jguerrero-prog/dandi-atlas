// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { AtlasData } from "../atlas/atlasData";
import { ATLASES } from "../atlas/configs";
import { HoverReadout } from "./HoverReadout";

afterEach(cleanup);

const data: AtlasData = {
  key: "allen_ccf",
  roots: [],
  version: "1",
  dandisetRegions: new Map(),
  electrodeDandisets: new Set(),
  manifest: { root_id: 997, data_structures: [672] },
  structures: new Map([
    [
      997,
      {
        id: 997,
        acronym: "root",
        name: "Whole brain",
        parent_structure_id: null,
      },
    ],
    [
      5,
      {
        id: 5,
        acronym: "XX",
        name: "Context region",
        parent_structure_id: 997,
      },
    ],
  ]),
  regions: new Map([
    [
      997,
      {
        acronym: "root",
        name: "Whole brain",
        file_count: 0,
        dandiset_count: 0,
        dandisets: [],
        total_file_count: 47378,
        total_dandiset_count: 70,
      },
    ],
    [
      672,
      {
        acronym: "CP",
        name: "Caudoputamen",
        file_count: 1,
        dandiset_count: 1,
        dandisets: ["000017"],
      },
    ],
  ]),
};
const config = ATLASES.allen_ccf;

describe("HoverReadout", () => {
  it("names a region with its acronym and coverage", () => {
    render(
      <HoverReadout
        hover={{ kind: "region", id: 672, x: 0, y: 0 }}
        data={data}
        config={config}
      />,
    );
    expect(screen.getByText("Caudoputamen")).toBeTruthy();
    expect(screen.getByText("CP")).toBeTruthy();
    expect(screen.getByText("1 dandiset, 1 file")).toBeTruthy();
  });

  it("gives the whole brain its totals without the jargon acronym", () => {
    render(
      <HoverReadout
        hover={{ kind: "region", id: 997, x: 0, y: 0 }}
        data={data}
        config={config}
      />,
    );
    expect(screen.getByText("70 dandisets, 47,378 files")).toBeTruthy();
    expect(screen.queryByText("root")).toBeNull();
  });

  it("says when a region has no DANDI data", () => {
    render(
      <HoverReadout
        hover={{ kind: "region", id: 5, x: 0, y: 0 }}
        data={data}
        config={config}
      />,
    );
    expect(screen.getByText("No DANDI data here")).toBeTruthy();
  });

  it("places an electrode in the atlas's coordinates", () => {
    render(
      <HoverReadout
        hover={{
          kind: "electrode",
          point: { coord: [6575, 3525.25, 4825], label: "Electrode 3" },
          x: 0,
          y: 0,
        }}
        data={data}
        config={config}
      />,
    );
    expect(screen.getByText("CCF 6575, 3525.3, 4825")).toBeTruthy();
  });
});
