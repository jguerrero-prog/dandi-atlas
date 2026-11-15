import type { CoordSystem } from "../atlas/configs";

export type ViewName =
  "dorsal" | "ventral" | "anterior" | "posterior" | "left" | "right";

/** Plain names first, with the anatomical term people may know them by. */
export const VIEWS: { value: ViewName; label: string; meta: string }[] = [
  { value: "dorsal", label: "Top", meta: "Dorsal" },
  { value: "ventral", label: "Bottom", meta: "Ventral" },
  { value: "anterior", label: "Front", meta: "Anterior" },
  { value: "posterior", label: "Back", meta: "Posterior" },
  { value: "left", label: "Left", meta: "Left" },
  { value: "right", label: "Right", meta: "Right" },
];

type Vec3 = [number, number, number];

/** Where the camera sits and which way is up for a view, around the brain's center. */
export function cameraFor(
  view: ViewName,
  coordSystem: CoordSystem,
  center: Vec3,
  distance: number,
) {
  const [x, y, z] = center;
  const d = distance;
  if (coordSystem === "ras") {
    // RAS: X right, Y anterior, Z superior.
    const ras: Record<ViewName, { position: Vec3; up: Vec3 }> = {
      dorsal: { position: [x, y, z + d], up: [0, 1, 0] },
      ventral: { position: [x, y, z - d], up: [0, -1, 0] },
      anterior: { position: [x, y + d, z], up: [0, 0, 1] },
      posterior: { position: [x, y - d, z], up: [0, 0, 1] },
      left: { position: [x - d, y, z], up: [0, 0, 1] },
      right: { position: [x + d, y, z], up: [0, 0, 1] },
    };
    return ras[view];
  }
  // Allen CCF (PIR): X posterior, Y inferior, Z right.
  const pir: Record<ViewName, { position: Vec3; up: Vec3 }> = {
    dorsal: { position: [x, y - d, z], up: [-1, 0, 0] },
    ventral: { position: [x, y + d, z], up: [1, 0, 0] },
    anterior: { position: [x - d, y, z], up: [0, -1, 0] },
    posterior: { position: [x + d, y, z], up: [0, -1, 0] },
    left: { position: [x, y, z - d], up: [0, -1, 0] },
    right: { position: [x, y, z + d], up: [0, -1, 0] },
  };
  return pir[view];
}
