import { fetchData, fetchLastUpdated, isRecord } from "../data/fetchData";
import type { AtlasKey } from "./configs";

/** A region in the atlas hierarchy, as structure_graph.json stores it. */
export interface Structure {
  id: number;
  acronym: string;
  name: string;
  color_hex_triplet?: string;
  parent_structure_id: number | null;
  children?: Structure[];
}

/** DANDI coverage of one region: its own counts, and totals that include its descendants. */
export interface DandiRegion {
  acronym: string;
  name: string;
  color_hex_triplet?: string;
  file_count: number;
  dandiset_count: number;
  dandisets: string[];
  total_file_count?: number;
  total_dandiset_count?: number;
  total_dandisets?: string[];
}

/** Which regions have meshes: those with data, their ancestors, and on non-Allen atlases every mesh built. */
export interface MeshManifest {
  root_id: number;
  data_structures: number[];
  ancestor_structures?: number[];
  no_mesh?: number[];
  all_meshes?: number[];
}

export interface AtlasData {
  key: AtlasKey;
  roots: Structure[];
  structures: Map<number, Structure>;
  regions: Map<number, DandiRegion>;
  manifest: MeshManifest;
  /** The regions each dandiset covers directly. */
  dandisetRegions: Map<string, number[]>;
  /** Dandisets with electrode positions in this atlas's space. */
  electrodeDandisets: Set<string>;
  /** Keys the data and mesh requests to the pipeline run, so a new run is never served from cache. */
  version: string;
}

/** Bump in the change that commits new meshes; the JSON files are keyed to the nightly run instead. */
export const MESH_VERSION = "20260519";

const isNumberArray = (value: unknown): value is number[] =>
  Array.isArray(value) && value.every((item) => typeof item === "number");

const isStructureList = (data: unknown): data is Structure[] =>
  Array.isArray(data) &&
  data.every(
    (node) =>
      isRecord(node) &&
      typeof node.id === "number" &&
      typeof node.name === "string",
  );

const isRegionMap = (data: unknown): data is Record<string, DandiRegion> =>
  isRecord(data) &&
  Object.values(data).every(
    (region) =>
      isRecord(region) &&
      typeof region.name === "string" &&
      Array.isArray(region.dandisets),
  );

const isManifest = (data: unknown): data is MeshManifest =>
  isRecord(data) &&
  typeof data.root_id === "number" &&
  isNumberArray(data.data_structures);

const isStringArray = (data: unknown): data is string[] =>
  Array.isArray(data) && data.every((item) => typeof item === "string");

const isTitleMap = (data: unknown): data is Record<string, string> =>
  isRecord(data) &&
  Object.values(data).every((title) => typeof title === "string");

/** Every dandiset's title, for all atlases at once; an empty map if the file can't be read. */
export async function fetchDandisetTitles(
  version: string,
): Promise<Map<string, string>> {
  try {
    const titles = await fetchData(
      `dandiset_titles.json?v=${version}`,
      isTitleMap,
    );
    return new Map(Object.entries(titles));
  } catch {
    return new Map();
  }
}

/** The pipeline's last run as digits (YYYYMMDDhhmmss); falls back to the mesh version if it can't be read. */
export async function dataVersion(): Promise<string> {
  try {
    const { timestamp } = await fetchLastUpdated();
    return timestamp.replace(/\D/g, "").slice(0, 14) || MESH_VERSION;
  } catch {
    return MESH_VERSION;
  }
}

function flatten(nodes: Structure[], into: Map<number, Structure>) {
  for (const node of nodes) {
    into.set(node.id, node);
    if (node.children) flatten(node.children, into);
  }
  return into;
}

/** Loads one atlas's hierarchy, coverage and mesh list. */
export async function loadAtlasData(
  key: AtlasKey,
  version: string,
): Promise<AtlasData> {
  const file = (name: string) => `atlases/${key}/${name}?v=${version}`;
  const [roots, regionMap, manifest, electrodes] = await Promise.all([
    fetchData(file("structure_graph.json"), isStructureList),
    fetchData(file("dandi_regions.json"), isRegionMap),
    fetchData(file("mesh_manifest.json"), isManifest),
    // Only atlases with electrode data have this file.
    fetchData(file("dandisets_with_electrodes.json"), isStringArray).catch(
      (): string[] => [],
    ),
  ]);
  const structures = flatten(roots, new Map());
  const regions = new Map(
    Object.entries(regionMap).map(([id, region]) => [Number(id), region]),
  );

  // The Allen CCF calls its root "root", which reads as jargon; the other atlases name it after themselves.
  const root = structures.get(manifest.root_id);
  if (root?.name === "root") {
    root.name = "Whole brain";
    const rootRegion = regions.get(manifest.root_id);
    if (rootRegion) rootRegion.name = "Whole brain";
  }
  const dandisetRegions = new Map<string, number[]>();
  for (const [id, region] of regions) {
    for (const dandiset of region.dandisets) {
      dandisetRegions.set(dandiset, [
        ...(dandisetRegions.get(dandiset) ?? []),
        id,
      ]);
    }
  }
  return {
    key,
    roots,
    structures,
    regions,
    manifest,
    dandisetRegions,
    electrodeDandisets: new Set(electrodes),
    version,
  };
}

/** A region's dandisets: those covering it directly first, then those covering only its subregions. */
export function regionDandisets(
  region: DandiRegion,
): { id: string; direct: boolean }[] {
  const direct = new Set(region.dandisets);
  const rest = (region.total_dandisets ?? []).filter((id) => !direct.has(id));
  return [
    ...region.dandisets.map((id) => ({ id, direct: true })),
    ...rest.map((id) => ({ id, direct: false })),
  ];
}

/** The region's totals including descendants, so parents like "Motor cortex" don't read as empty. */
export const regionTotals = (region: DandiRegion) => ({
  dandisets: region.total_dandiset_count ?? region.dandiset_count,
  files: region.total_file_count ?? region.file_count,
});
