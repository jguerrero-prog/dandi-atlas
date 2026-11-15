import type { TreeNode } from "@ui";
import {
  regionTotals,
  type AtlasData,
  type Structure,
} from "../atlas/atlasData";

const plural = (count: number, word: string) =>
  `${count.toLocaleString("en-US")} ${word}${count === 1 ? "" : "s"}`;

/** True when DANDI files land in the region or any of its subregions. */
export function hasData(data: AtlasData, id: number): boolean {
  const region = data.regions.get(id);
  return region ? regionTotals(region).files > 0 : false;
}

/** The region's ancestors, from the root down to its parent. */
export function ancestorsOf(data: AtlasData, id: number): number[] {
  const path: number[] = [];
  let current = data.structures.get(id)?.parent_structure_id ?? null;
  while (current !== null) {
    path.unshift(current);
    current = data.structures.get(current)?.parent_structure_id ?? null;
  }
  return path;
}

export function regionName(data: AtlasData, id: number) {
  return (
    data.regions.get(id)?.name ??
    data.structures.get(id)?.name ??
    "Unnamed region"
  );
}

/** The acronym where it adds something: never the Allen root's "root". */
export function regionAcronym(data: AtlasData, id: number) {
  const acronym =
    data.regions.get(id)?.acronym ?? data.structures.get(id)?.acronym;
  return acronym && acronym !== "root" && acronym !== regionName(data, id)
    ? acronym
    : undefined;
}

/** "Caudoputamen (CP): 12 dandisets, 395 files", read on hover so cut-off names and bare counts make sense. */
export function regionHint(data: AtlasData, id: number) {
  const acronym = regionAcronym(data, id);
  const name = `${regionName(data, id)}${acronym ? ` (${acronym})` : ""}`;
  const region = data.regions.get(id);
  if (!region || !hasData(data, id)) return `${name}: no DANDI data`;
  const totals = regionTotals(region);
  return `${name}: ${plural(totals.dandisets, "dandiset")}, ${plural(totals.files, "file")}`;
}

interface TreeOptions {
  query: string;
  /** Include regions without DANDI data. */
  showEmpty: boolean;
  /** Regions that stay visible whatever the filter, such as the selection. */
  keep: ReadonlySet<number>;
  /** Inside a dandiset: only its regions, each counting the dandiset's subjects that record there. */
  scope?: { ids: ReadonlySet<number>; counts: ReadonlyMap<number, number> };
}

/**
 * The tree as shown: regions without data hidden unless asked for, and while searching only matches and the
 * regions leading to them, which open so the matches can be seen. The selection always stays in view.
 */
export function buildRegionTree(
  data: AtlasData,
  { query, showEmpty, keep, scope }: TreeOptions,
) {
  const needle = query.trim().toLowerCase();
  const matchIds = new Set<number>();
  const open = new Set<number>();
  const kept = new Set<number>();
  for (const id of keep) {
    kept.add(id);
    for (const ancestor of ancestorsOf(data, id)) {
      kept.add(ancestor);
      open.add(ancestor);
    }
  }

  const matches = (node: Structure) =>
    node.name.toLowerCase().includes(needle) ||
    (regionAcronym(data, node.id)?.toLowerCase().includes(needle) ?? false);

  const visit = (node: Structure): TreeNode | null => {
    const children = (node.children ?? [])
      .map(visit)
      .filter((child): child is TreeNode => child !== null);
    const isRoot = node.id === data.manifest.root_id;
    const shownByData = scope
      ? isRoot || scope.ids.has(node.id)
      : showEmpty || isRoot || hasData(data, node.id);
    const isMatch = needle !== "" && !isRoot && matches(node);
    if (isMatch && shownByData) matchIds.add(node.id);
    const shown = needle
      ? (isMatch && shownByData) ||
        children.length > 0 ||
        kept.has(node.id) ||
        isRoot
      : shownByData || children.length > 0 || kept.has(node.id);
    if (!shown) return null;
    if (needle && children.length > 0) open.add(node.id);
    const region = data.regions.get(node.id);
    const count = scope
      ? (scope.counts.get(node.id) ?? null)
      : region && hasData(data, node.id)
        ? regionTotals(region).dandisets
        : null;
    return {
      id: String(node.id),
      name: node.name,
      kind: children.length > 0 ? "folder" : "file",
      size: count === null ? undefined : count.toLocaleString("en-US"),
      swatch: node.color_hex_triplet ? `#${node.color_hex_triplet}` : undefined,
      hint:
        scope && count !== null
          ? `${regionName(data, node.id)}: ${plural(count, "subject")} in this dandiset`
          : regionHint(data, node.id),
      children: children.length > 0 ? children : undefined,
    };
  };

  const nodes = data.roots
    .map(visit)
    .filter((node): node is TreeNode => node !== null);
  return { nodes, matches: matchIds.size, open: [...open].map(String) };
}
