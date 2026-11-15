import { describe, expect, it } from "vitest";
import { parseRoute, routeHref } from "./route";

describe("parseRoute", () => {
  it("opens the landing page on a bare address", () => {
    expect(parseRoute("", "")).toEqual({ page: "landing" });
  });

  it("reads the original viewer's links", () => {
    expect(parseRoute("?atlas=d99", "")).toMatchObject({
      page: "atlas",
      atlas: "d99",
      regions: [],
      comparing: false,
    });
    expect(parseRoute("", "#region=672")).toMatchObject({
      atlas: "allen_ccf",
      regions: [672],
      comparing: false,
    });
    expect(parseRoute("?atlas=allen_ccf", "#region=672,385,672")).toMatchObject(
      { regions: [672, 385], comparing: true },
    );
    expect(
      parseRoute("", "#dandiset=000017&subject=sub-M1&session=abc"),
    ).toMatchObject({
      dandiset: "000017",
      subject: "sub-M1",
      session: "abc",
    });
  });

  it("ignores an unknown atlas and malformed region ids", () => {
    expect(parseRoute("?atlas=nope", "#region=x,0,-4,12")).toMatchObject({
      atlas: "allen_ccf",
      regions: [12],
    });
  });
});

describe("routeHref", () => {
  const atlas = {
    page: "atlas" as const,
    atlas: "allen_ccf" as const,
    regions: [],
    comparing: false,
  };

  it("writes routes the way the original viewer did", () => {
    expect(routeHref({ page: "landing" }, "/")).toBe("/");
    expect(routeHref(atlas, "/")).toBe("/?atlas=allen_ccf");
    expect(
      routeHref({ ...atlas, regions: [672, 385], comparing: true }, "/x/"),
    ).toBe("/x/?atlas=allen_ccf#region=672,385");
  });

  it("keeps compare mode when one region is chosen so far", () => {
    const href = routeHref({ ...atlas, regions: [672], comparing: true }, "/");
    expect(href).toBe("/?atlas=allen_ccf#region=672&compare=1");
    const [search, hash] = href.slice(1).split("#");
    expect(parseRoute(search, `#${hash}`)).toMatchObject({
      regions: [672],
      comparing: true,
    });
  });
});
