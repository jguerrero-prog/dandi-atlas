import { fetchData, isRecord } from "../data/fetchData";
import type { AtlasKey } from "../atlas/configs";

/** One NWB file and the regions it records in, as dandiset_assets.json stores it. */
export interface Asset {
  path: string;
  asset_id: string;
  regions: { id: number; acronym?: string; name?: string }[];
  session?: string;
  desc?: string;
}

export type Coord = [number, number, number];

const isAsset = (item: unknown): item is Asset =>
  isRecord(item) &&
  typeof item.path === "string" &&
  typeof item.asset_id === "string" &&
  Array.isArray(item.regions) &&
  item.regions.every(
    (region) => isRecord(region) && typeof region.id === "number",
  );

const isAssetMap = (data: unknown): data is Record<string, Asset[]> =>
  isRecord(data) &&
  Object.values(data).every(
    (list) => Array.isArray(list) && list.every(isAsset),
  );

const isCoord = (item: unknown): item is Coord =>
  Array.isArray(item) &&
  item.length >= 3 &&
  item.slice(0, 3).every((n) => typeof n === "number");

const isElectrodeMap = (data: unknown): data is Record<string, Coord[]> =>
  isRecord(data) &&
  Object.values(data).every(
    (list) => Array.isArray(list) && list.every(isCoord),
  );

// Both files are large and change only nightly, so each is read once per atlas, or per dandiset, and kept.
const assetCache = new Map<string, Promise<Record<string, Asset[]>>>();
const electrodeCache = new Map<
  string,
  Promise<Record<string, Coord[]> | null>
>();

/** Every dandiset's files in an atlas, read on the first dandiset opened. */
export function fetchAssets(atlas: AtlasKey, version: string) {
  const key = `${atlas}?v=${version}`;
  let request = assetCache.get(key);
  if (!request) {
    request = fetchData(
      `atlases/${atlas}/dandiset_assets.json?v=${version}`,
      isAssetMap,
    );
    request.catch(() => assetCache.delete(key));
    assetCache.set(key, request);
  }
  return request;
}

/** Electrode positions by asset for one dandiset, or null when the atlas has none for it. */
export function fetchElectrodes(
  atlas: AtlasKey,
  dandiset: string,
  version: string,
) {
  const key = `${atlas}/${dandiset}?v=${version}`;
  let request = electrodeCache.get(key);
  if (!request) {
    request = fetchData(
      `atlases/${atlas}/electrodes/${dandiset}.json?v=${version}`,
      isElectrodeMap,
    ).catch(() => null);
    electrodeCache.set(key, request);
  }
  return request;
}
