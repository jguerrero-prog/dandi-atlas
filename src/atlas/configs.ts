/** How each atlas is drawn: its camera, scale and attribution. Values carried over from the original viewer. */
export type AtlasKey = "allen_ccf" | "d99" | "nmt" | "mebrains" | "whs_sd";

/** Allen CCF is PIR in micrometres; the macaque and rat atlases are RAS in millimetres. */
export type CoordSystem = "allen" | "ras";

export interface AtlasConfig {
  key: AtlasKey;
  name: string;
  species: string;
  camDist: number;
  cameraUp: [number, number, number];
  /** The direction the camera starts from: a lateral view. */
  camOffset: [number, number, number];
  nearPlane: number;
  farPlane: number;
  /** Electrode dots are exaggerated to about 1.5% of brain width so they can be seen. */
  electrodeSize: number;
  electrodePickThreshold: number;
  rootOpacity: number;
  coordSystem: CoordSystem;
  /** Short name shown before electrode coordinates. */
  coordLabel: string;
  attribution: string;
  attributionUrl: string;
  regionLinkTemplate: string | null;
}

const MACAQUE: Pick<
  AtlasConfig,
  | "species"
  | "camDist"
  | "cameraUp"
  | "camOffset"
  | "nearPlane"
  | "farPlane"
  | "electrodeSize"
  | "electrodePickThreshold"
  | "coordSystem"
  | "regionLinkTemplate"
> = {
  species: "Macaque",
  camDist: 200,
  cameraUp: [0, 0, 1],
  camOffset: [1, 0, 0],
  nearPlane: 0.1,
  farPlane: 1000,
  electrodeSize: 0.75,
  electrodePickThreshold: 1,
  coordSystem: "ras",
  regionLinkTemplate: null,
};

export const ATLASES: Record<AtlasKey, AtlasConfig> = {
  allen_ccf: {
    key: "allen_ccf",
    name: "Allen CCF v3",
    species: "Mouse",
    camDist: 18000,
    cameraUp: [0, -1, 0],
    camOffset: [0, 0, 1],
    nearPlane: 1,
    farPlane: 100000,
    electrodeSize: 150,
    electrodePickThreshold: 180,
    rootOpacity: 0.06,
    coordSystem: "allen",
    coordLabel: "CCF",
    attribution: "Allen Institute CCF",
    attributionUrl: "https://atlas.brain-map.org/",
    regionLinkTemplate:
      "https://atlas.brain-map.org/atlas#atlas=2&structure={id}",
  },
  d99: {
    ...MACAQUE,
    key: "d99",
    name: "D99 v2.0",
    rootOpacity: 0.3,
    coordLabel: "D99",
    attribution: "D99 v2 (Saleem & Logothetis)",
    attributionUrl:
      "https://afni.nimh.nih.gov/pub/dist/doc/htmldoc/nonhuman/macaque_tempatl/atlas_d99v2.html",
  },
  nmt: {
    ...MACAQUE,
    key: "nmt",
    name: "NMT v2.0 sym",
    rootOpacity: 0.25,
    coordLabel: "NMT",
    attribution: "NMT v2 (Jung et al. 2021)",
    attributionUrl:
      "https://afni.nimh.nih.gov/pub/dist/doc/htmldoc/nonhuman/macaque_tempatl/template_nmtv2.html",
  },
  mebrains: {
    ...MACAQUE,
    key: "mebrains",
    name: "MEBRAINS",
    rootOpacity: 0.25,
    coordLabel: "MEBRAINS",
    attribution: "MEBRAINS (EBRAINS)",
    attributionUrl: "https://ebrains.eu/tools/mebrains",
  },
  whs_sd: {
    key: "whs_sd",
    name: "WHS-SD v4",
    species: "Rat",
    camDist: 60,
    cameraUp: [0, 0, 1],
    camOffset: [1, 0, 0],
    nearPlane: 0.1,
    farPlane: 500,
    electrodeSize: 0.3,
    electrodePickThreshold: 0.5,
    rootOpacity: 0.25,
    coordSystem: "ras",
    coordLabel: "WHS",
    attribution: "WHS-SD v4 (Kleven et al. 2023)",
    attributionUrl: "https://www.nitrc.org/projects/whs-sd-atlas",
    regionLinkTemplate: null,
  },
};

export const isAtlasKey = (value: string | null): value is AtlasKey =>
  value !== null && Object.hasOwn(ATLASES, value);
