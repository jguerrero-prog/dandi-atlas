import type { DandiRegion, MeshManifest, Structure } from "../atlas/atlasData";
import type { CoordSystem } from "../atlas/configs";

/**
 * A mesh's role in the current view:
 * active is the focus; glass is the Allen outline, always; roi is a soft overlay of extra regions;
 * silhouette is the rim of a non-Allen outline; hidden is not drawn.
 */
export type DisplayMode = "active" | "glass" | "roi" | "silhouette" | "hidden";

export interface ModeContext {
  rootId: number;
  coordSystem: CoordSystem;
  activeIds: ReadonlySet<number>;
  roiIds?: ReadonlySet<number>;
}

export function decideDisplayMode(
  id: number,
  { rootId, coordSystem, activeIds, roiIds }: ModeContext,
): DisplayMode {
  const isRoot = id === rootId;
  if (isRoot && coordSystem === "allen") return "glass";
  if (activeIds.has(id)) return "active";
  if (roiIds?.has(id)) return "roi";
  if (isRoot) return "silhouette";
  return "hidden";
}

/** How a mesh looks before any view changes it. */
export interface BaseLook {
  color: number;
  opacity: number;
  wireframe: boolean;
  doubleSided: boolean;
  depthWrite: boolean;
}

const FALLBACK_COLOR = 0xaaaaaa;

/** The atlas's own color for a region (data, not design): coverage first, then the hierarchy. */
export function regionColor(
  region?: DandiRegion,
  structure?: Structure,
): number {
  const hex = region?.color_hex_triplet ?? structure?.color_hex_triplet;
  return hex ? parseInt(hex, 16) : FALLBACK_COLOR;
}

/**
 * Regions with data are solid, more opaque the more dandisets cover them; the rest are faint context.
 * The outline's color is null: it follows the 3D view's theme instead of the atlas.
 */
export function baseLook(options: {
  isRoot: boolean;
  region?: DandiRegion;
  structure?: Structure;
  coordSystem: CoordSystem;
  rootOpacity: number;
}): BaseLook & { themed: boolean } {
  const { isRoot, region, structure, coordSystem, rootOpacity } = options;
  const color = regionColor(region, structure);
  if (isRoot) {
    return {
      color,
      opacity: rootOpacity,
      wireframe: false,
      doubleSided: false,
      depthWrite: false,
      themed: true,
    };
  }
  if (region) {
    const count = region.total_dandiset_count ?? region.dandiset_count ?? 1;
    const opacity = Math.min(0.3 + 0.2 * Math.log2(count + 1), 0.9);
    return {
      color,
      opacity,
      wireframe: false,
      doubleSided: true,
      depthWrite: true,
      themed: false,
    };
  }
  // Allen draws context regions as faint wireframe; the other atlases as faint solids.
  return coordSystem === "allen"
    ? {
        color,
        opacity: 0.05,
        wireframe: true,
        doubleSided: true,
        depthWrite: false,
        themed: false,
      }
    : {
        color,
        opacity: 0.15,
        wireframe: false,
        doubleSided: true,
        depthWrite: false,
        themed: false,
      };
}

export interface ModeLook {
  visible: boolean;
  opacity: number;
  transparent: boolean;
  depthWrite: boolean;
}

const HIDDEN: ModeLook = {
  visible: false,
  opacity: 0,
  transparent: true,
  depthWrite: false,
};
/** The rim shader draws its own alpha, so the silhouette stays as context even at zero Regions opacity. */
const SILHOUETTE: ModeLook = {
  visible: true,
  opacity: 1,
  transparent: true,
  depthWrite: false,
};

/** Applies a mode and the Regions opacity setting to a mesh's base look. Silhouette uses its own rim shader. */
export function modeLook(
  mode: DisplayMode,
  base: BaseLook,
  regionOpacity: number,
): ModeLook {
  if (mode === "silhouette") return SILHOUETTE;
  if (mode === "hidden" || regionOpacity === 0) return HIDDEN;
  if (mode === "active") {
    return {
      visible: true,
      opacity: regionOpacity,
      transparent: regionOpacity < 1,
      depthWrite: regionOpacity >= 1,
    };
  }
  if (mode === "glass") {
    const opacity = base.opacity * regionOpacity;
    return {
      visible: true,
      opacity,
      transparent: opacity < 1,
      depthWrite: base.depthWrite,
    };
  }
  return {
    visible: true,
    opacity: regionOpacity * 0.35,
    transparent: true,
    depthWrite: false,
  };
}

/** Allen loads only regions with data up front; the other atlases load every mesh so their trees are complete. */
export function initialMeshIds(
  manifest: MeshManifest,
  coordSystem: CoordSystem,
): number[] {
  const skip = new Set(manifest.no_mesh ?? []);
  const ids =
    coordSystem === "allen"
      ? manifest.data_structures
      : (manifest.all_meshes ?? manifest.data_structures);
  return ids.filter((id) => id !== manifest.root_id && !skip.has(id));
}
