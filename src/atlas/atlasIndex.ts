import { fetchData, isRecord } from "../data/fetchData";
import { isAtlasKey, type AtlasKey } from "./configs";

/** One atlas on the landing page, as the nightly job summarizes it. */
export interface AtlasSummary {
  key: AtlasKey;
  name: string;
  species: string;
  /** Path to the card image inside data/. */
  preview: string;
  dandiset_count: number;
  file_count: number;
  regions_with_data: number;
}

const isSummary = (item: unknown): item is AtlasSummary =>
  isRecord(item) &&
  typeof item.key === "string" &&
  isAtlasKey(item.key) &&
  typeof item.name === "string" &&
  typeof item.species === "string" &&
  typeof item.preview === "string" &&
  typeof item.dandiset_count === "number" &&
  typeof item.file_count === "number" &&
  typeof item.regions_with_data === "number";

const isIndex = (data: unknown): data is { atlases: AtlasSummary[] } =>
  isRecord(data) &&
  Array.isArray(data.atlases) &&
  data.atlases.every(isSummary);

export const fetchAtlasIndex = async (version: string) =>
  (await fetchData(`atlases_index.json?v=${version}`, isIndex)).atlases;

/** Atlases grouped by species, in the order the index lists them. */
export function bySpecies(
  atlases: AtlasSummary[],
): { species: string; atlases: AtlasSummary[] }[] {
  const groups = new Map<string, AtlasSummary[]>();
  for (const atlas of atlases)
    groups.set(atlas.species, [...(groups.get(atlas.species) ?? []), atlas]);
  return [...groups].map(([species, list]) => ({ species, atlases: list }));
}
