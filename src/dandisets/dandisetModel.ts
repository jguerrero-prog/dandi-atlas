import type { AtlasData } from "../atlas/atlasData";
import type { CoordSystem } from "../atlas/configs";
import type { Asset, Coord } from "./dandisetData";

export interface Subject {
  /** The folder, such as sub-M1, which links use. */
  dir: string;
  /** The folder without sub-, as people read it. */
  name: string;
  assets: Asset[];
  regionIds: Set<number>;
}

const natural = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: "base",
});

/** Files grouped by subject folder, each subject's regions merged, both in natural order (2 before 10). */
export function groupSubjects(assets: Asset[]): Subject[] {
  const subjects = new Map<string, Subject>();
  for (const asset of assets) {
    const parts = asset.path.split("/");
    const dir = parts.length > 1 ? parts[0] : asset.path.split("_")[0];
    const subject = subjects.get(dir) ?? {
      dir,
      name: dir.replace(/^sub-/, ""),
      assets: [],
      regionIds: new Set(),
    };
    subject.assets.push(asset);
    for (const region of asset.regions) subject.regionIds.add(region.id);
    subjects.set(dir, subject);
  }
  // The subjects are built here, so sorting their own lists in place is safe.
  for (const subject of subjects.values())
    subject.assets.sort((a, b) =>
      natural.compare(a.session ?? a.path, b.session ?? b.path),
    );
  return [...subjects.values()].toSorted((a, b) =>
    natural.compare(a.name, b.name),
  );
}

/** A region and every region below it. */
export function withDescendants(data: AtlasData, id: number): Set<number> {
  const ids = new Set<number>();
  const walk = (
    node: { id: number; children?: { id: number }[] } | undefined,
  ) => {
    if (!node) return;
    ids.add(node.id);
    node.children?.forEach((child) => walk(data.structures.get(child.id)));
  };
  walk(data.structures.get(id));
  return ids;
}

/** Subjects that record in the region or any region below it. */
export function subjectsInRegion(
  data: AtlasData,
  subjects: Subject[],
  regionId: number,
) {
  const inside = withDescendants(data, regionId);
  return subjects.filter((subject) =>
    [...subject.regionIds].some((id) => inside.has(id)),
  );
}

/** How many subjects record directly in each region, for the tree's counts inside a dandiset. */
export function subjectCounts(subjects: Subject[]): Map<number, number> {
  const counts = new Map<number, number>();
  for (const subject of subjects)
    for (const id of subject.regionIds)
      counts.set(id, (counts.get(id) ?? 0) + 1);
  return counts;
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** The kind of file, from its description or its name, so two files of one session can be told apart. */
function fileKind(asset: Asset): string | undefined {
  if (asset.desc) return asset.desc;
  const file = asset.path.split("/").pop() ?? "";
  if (file.includes("processed-only_behavior")) return "behavior only";
  if (file.includes("behavior+ecephys")) return "processed";
  if (file.includes("ecephys+image")) return "ecephys and images";
  return undefined;
}

/**
 * A session as people read it: a session id that starts with a date and time becomes "Dec 14, 2016, 12:34";
 * other ids stay as they are. The full id and path go in the hint.
 */
export function sessionName(asset: Asset): { label: string; hint: string } {
  const file = asset.path.split("/").pop() ?? asset.path;
  const id = asset.session;
  const kind = fileKind(asset);
  let label = id ?? file;
  const stamp = id?.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2}))?/);
  if (stamp) {
    const [, year, month, day, hour, minute] = stamp;
    const monthName = MONTHS[Number(month) - 1];
    if (monthName && Number(day) >= 1 && Number(day) <= 31) {
      label = `${monthName} ${Number(day)}, ${year}${hour ? `, ${hour}:${minute}` : ""}`;
    }
  }
  return {
    label: kind ? `${label} (${kind})` : label,
    hint: [id ? `Session ${id}` : null, asset.path].filter(Boolean).join("\n"),
  };
}

/**
 * Session names for a subject's files. Files that share a session, such as one per probe, get what sets
 * them apart from the file name: "probe-773592315 ecephys", or "main file" for the one with nothing extra.
 */
export function sessionNames(
  assets: Asset[],
): Map<string, { label: string; hint: string }> {
  const names = new Map(
    assets.map((asset) => [asset.asset_id, sessionName(asset)]),
  );
  const counts = new Map<string, number>();
  for (const name of names.values())
    counts.set(name.label, (counts.get(name.label) ?? 0) + 1);
  for (const asset of assets) {
    const name = names.get(asset.asset_id)!;
    if ((counts.get(name.label) ?? 0) < 2) continue;
    const file = (asset.path.split("/").pop() ?? "").replace(/\.nwb$/, "");
    const rest = file
      .split("_")
      .filter((part) => !/^(sub|ses)-/.test(part))
      .join(" ");
    names.set(asset.asset_id, {
      ...name,
      label: `${name.label} · ${rest || "main file"}`,
    });
  }
  return names;
}

/** Sentinels some pipelines write for unknown positions. */
const isUnknown = ([x, y, z]: Coord) =>
  (x === 0 && y === 0 && z === 0) || (x === -1 && y === -1 && z === -1);

/**
 * Electrode positions ready to draw: unknown ones dropped, and Allen coordinates stored in 10 µm voxels
 * (every value between 100 and 1500) scaled to micrometres like the meshes.
 */
export function drawableCoords(
  coords: Coord[],
  coordSystem: CoordSystem,
): Coord[] {
  const known = coords
    .filter((coord) => !isUnknown(coord))
    .map(([x, y, z]): Coord => [x, y, z]);
  if (coordSystem !== "allen" || known.length === 0) return known;
  // A loop, not Math.max(...): a large dandiset has more positions than a call can take as arguments.
  let largest = 0;
  for (const coord of known)
    for (const value of coord) largest = Math.max(largest, Math.abs(value));
  const scale = largest > 100 && largest < 1500 ? 10 : 1;
  return scale === 1
    ? known
    : known.map(([x, y, z]): Coord => [x * scale, y * scale, z * scale]);
}
