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
  const [roots, regionMap, manifest] = await Promise.all([
    fetchData(file("structure_graph.json"), isStructureList),
    fetchData(file("dandi_regions.json"), isRegionMap),
    fetchData(file("mesh_manifest.json"), isManifest),
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
  return { key, roots, structures, regions, manifest, version };
}

/** The region's totals including descendants, so parents like "Motor cortex" don't read as empty. */
export const regionTotals = (region: DandiRegion) => ({
  dandisets: region.total_dandiset_count ?? region.dandiset_count,
  files: region.total_file_count ?? region.file_count,
});
