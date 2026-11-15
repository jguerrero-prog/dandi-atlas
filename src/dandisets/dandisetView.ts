import type { AtlasData } from "../atlas/atlasData";
import type { CoordSystem } from "../atlas/configs";
import type { ElectrodePoint } from "../scene/BrainScene";
import type { Asset, Coord } from "./dandisetData";
import {
  drawableCoords,
  sessionName,
  subjectsInRegion,
  withDescendants,
  type Subject,
} from "./dandisetModel";

interface ViewInput {
  data: AtlasData;
  coordSystem: CoordSystem;
  dandiset: string;
  subjects: Subject[];
  electrodes: ReadonlyMap<string, Coord[]>;
  /** The region the dandiset is filtered to, if any. */
  regionFilter?: number;
  subjectDir?: string;
  sessionId?: string;
  /** Regions people hid with the visibility checkboxes. */
  hidden: ReadonlySet<number>;
  /** Series colors, one per session in a subject. */
  sessionColors: readonly string[];
}

export interface DandisetView {
  /** Subjects listed, after the region filter. */
  shown: Subject[];
  subject?: Subject;
  session?: Asset;
  /** The regions this view covers, before hiding: the visibility list. */
  regionIds: number[];
  /** The regions to spotlight. */
  focusIds: number[];
  electrodes: ElectrodePoint[];
  /** Session colors by asset id, for the session rows' swatches. */
  sessionColor: ReadonlyMap<string, string>;
}

const points = (
  asset: Asset,
  coords: Coord[] | undefined,
  coordSystem: CoordSystem,
  color?: string,
) =>
  drawableCoords(coords ?? [], coordSystem).map(
    (coord, index): ElectrodePoint => ({
      coord,
      label: `Electrode ${index + 1} · ${sessionName(asset).label}`,
      color,
    }),
  );

/**
 * What a dandiset view shows. The dandiset spotlights all its regions; a region filter narrows the subjects
 * and regions to those inside it; a subject draws every session's electrodes, one color per session;
 * a session draws its own electrodes in the electrode color.
 */
export function dandisetView(input: ViewInput): DandisetView {
  const {
    data,
    coordSystem,
    dandiset,
    subjects,
    electrodes,
    regionFilter,
    hidden,
    sessionColors,
  } = input;
  const shown =
    regionFilter === undefined
      ? subjects
      : subjectsInRegion(data, subjects, regionFilter);
  // A link from Neurosift names the file but not its subject folder, so the file finds its subject.
  const subject =
    subjects.find((candidate) => candidate.dir === input.subjectDir) ??
    (input.sessionId
      ? subjects.find((candidate) =>
          candidate.assets.some((asset) => asset.asset_id === input.sessionId),
        )
      : undefined);
  const session = subject?.assets.find(
    (asset) => asset.asset_id === input.sessionId,
  );

  const sessionColor = new Map<string, string>();
  if (subject) {
    const keys = [
      ...new Set(subject.assets.map((asset) => asset.session ?? asset.path)),
    ];
    for (const asset of subject.assets) {
      sessionColor.set(
        asset.asset_id,
        sessionColors[
          keys.indexOf(asset.session ?? asset.path) % sessionColors.length
        ],
      );
    }
  }

  let regionIds: number[];
  if (session) regionIds = session.regions.map((region) => region.id);
  else if (subject) regionIds = [...subject.regionIds];
  else {
    const fromSubjects = new Set<number>();
    for (const s of subjects)
      for (const id of s.regionIds) fromSubjects.add(id);
    const all = data.dandisetRegions.get(dandiset) ?? [...fromSubjects];
    if (regionFilter === undefined) regionIds = all;
    else {
      const inside = withDescendants(data, regionFilter);
      const matching = all.filter((id) => inside.has(id));
      regionIds = matching.length > 0 ? matching : [regionFilter];
    }
  }

  let drawn: ElectrodePoint[] = [];
  if (session)
    drawn = points(session, electrodes.get(session.asset_id), coordSystem);
  else if (subject)
    drawn = subject.assets.flatMap((asset) =>
      points(
        asset,
        electrodes.get(asset.asset_id),
        coordSystem,
        sessionColor.get(asset.asset_id),
      ),
    );

  return {
    shown,
    subject,
    session,
    regionIds,
    focusIds: regionIds.filter((id) => !hidden.has(id)),
    electrodes: drawn,
    sessionColor,
  };
}
