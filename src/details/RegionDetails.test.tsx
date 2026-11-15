// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { AtlasData, DandiRegion } from "../atlas/atlasData";
import { ATLASES } from "../atlas/configs";
import { RegionDetails } from "./RegionDetails";

afterEach(cleanup);

const region = (
  name: string,
  acronym: string,
  dandisets: string[],
  total: string[] = dandisets,
): DandiRegion => ({
  name,
  acronym,
  file_count: 10,
  dandiset_count: dandisets.length,
  dandisets,
  total_dandisets: total,
  total_dandiset_count: total.length,
  total_file_count: 20,
});

const data: AtlasData = {
  key: "allen_ccf",
  roots: [],
  version: "1",
  manifest: { root_id: 997, data_structures: [672, 242] },
  structures: new Map([
    [
      997,
      {
        id: 997,
        name: "Whole brain",
        acronym: "root",
        parent_structure_id: null,
      },
    ],
    [
      672,
      {
        id: 672,
        name: "Caudoputamen",
        acronym: "CP",
        parent_structure_id: 997,
      },
    ],
    [
      242,
      {
        id: 242,
        name: "Lateral septal nucleus",
        acronym: "LS",
        parent_structure_id: 997,
      },
    ],
  ]),
  regions: new Map([
    [997, region("Whole brain", "root", [], ["000017", "000022"])],
    [672, region("Caudoputamen", "CP", ["000017"], ["000017", "000022"])],
    [242, region("Lateral septal nucleus", "LS", ["000017"])],
  ]),
  dandisetRegions: new Map([
    ["000017", [672, 242]],
    ["000022", [672]],
  ]),
  electrodeDandisets: new Set(["000022"]),
};
const titles = new Map([["000017", "Distributed coding of choice"]]);

const renderDetails = (selectedIds: number[], comparing: boolean) => {
  const onSelect = vi.fn<(ids: number[]) => void>();
  const onCompare = vi.fn<(comparing: boolean) => void>();
  render(
    <RegionDetails
      config={ATLASES.allen_ccf}
      data={data}
      titles={titles}
      selectedIds={selectedIds}
      comparing={comparing}
      onSelect={onSelect}
      onCompare={onCompare}
    />,
  );
  return { onSelect, onCompare };
};

describe("RegionDetails", () => {
  it("names the region, links the Allen atlas and lists direct dandisets before those in subregions", () => {
    renderDetails([672], false);
    expect(screen.getByRole("heading", { name: "Caudoputamen" })).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: "View in the Allen Brain Atlas" })
        .getAttribute("href"),
    ).toContain("structure=672");
    const notes = [...document.querySelectorAll(".ns-catalog-modified")].map(
      (note) => note.textContent,
    );
    expect(notes).toEqual([
      "Recorded in this region",
      "Recorded in its subregions",
    ]);
    expect(screen.getByText("Distributed coding of choice")).toBeTruthy();
    expect(screen.getByText("Dandiset 000022")).toBeTruthy();
    expect(screen.getByText("Electrode positions")).toBeTruthy();
  });

  it("offers the whole brain and compare mode", () => {
    const { onSelect, onCompare } = renderDetails([672], false);
    fireEvent.click(screen.getByRole("button", { name: "Show whole brain" }));
    expect(onSelect).toHaveBeenCalledWith([]);
    fireEvent.click(screen.getByRole("button", { name: "Compare regions" }));
    expect(onCompare).toHaveBeenCalledWith(true);
  });

  it("shows the whole brain without the region-only actions", () => {
    renderDetails([], false);
    expect(screen.getByRole("heading", { name: "Whole brain" })).toBeTruthy();
    expect(
      screen.queryByRole("button", { name: "Show whole brain" }),
    ).toBeNull();
    expect(
      screen.queryByRole("link", { name: "View in the Allen Brain Atlas" }),
    ).toBeNull();
  });

  it("compares regions: each one removable, dandisets in every region first", () => {
    const { onSelect } = renderDetails([672, 242], true);
    expect(
      screen.getByRole("heading", { name: "Comparing 2 regions" }),
    ).toBeTruthy();
    const notes = [...document.querySelectorAll(".ns-catalog-modified")].map(
      (note) => note.textContent,
    );
    expect(notes).toEqual([
      "Records in every compared region",
      "Records in CP",
    ]);
    fireEvent.click(
      screen.getByRole("button", { name: /Remove Caudoputamen|Caudoputamen/ }),
    );
    expect(onSelect).toHaveBeenCalledWith([242]);
  });
});
