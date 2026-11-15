/** Neurosift, where dandisets and NWB files open; set VITE_NEUROSIFT_URL to point elsewhere. */
const NEUROSIFT =
  import.meta.env.VITE_NEUROSIFT_URL ?? "https://v3.neurosift.app/";
const base = NEUROSIFT.endsWith("/") ? NEUROSIFT : `${NEUROSIFT}/`;

/** A dandiset's page in Neurosift: its files, description and views. */
export const neurosiftDandiset = (dandiset: string) =>
  `${base}dandiset/${dandiset}`;

/** One NWB file in Neurosift, read straight from DANDI, as Neurosift's own dandiset page links it. */
export const neurosiftFile = (dandiset: string, assetId: string) =>
  `${base}nwb?url=https://api.dandiarchive.org/api/assets/${assetId}/download/&dandisetId=${dandiset}&dandisetVersion=draft`;
