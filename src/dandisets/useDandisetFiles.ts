import { useEffect, useState } from "react";
import type { AtlasData } from "../atlas/atlasData";
import { fetchAssets, fetchElectrodes, type Coord } from "./dandisetData";
import { groupSubjects, type Subject } from "./dandisetModel";

export type DandisetFiles =
  | { status: "loading" }
  | {
      status: "ready";
      subjects: Subject[];
      /** Electrode positions by asset id; empty when the atlas has none for this dandiset. */
      electrodes: ReadonlyMap<string, Coord[]>;
    }
  | { status: "error"; message: string };

const LOADING: DandisetFiles = { status: "loading" };

/** A dandiset's files grouped by subject, and its electrode positions, for the open atlas. */
export function useDandisetFiles(
  data: AtlasData | null,
  dandiset: string | undefined,
): DandisetFiles {
  const request =
    data && dandiset ? `${data.key}/${dandiset}?v=${data.version}` : "";
  const [result, setResult] = useState<{
    request: string;
    files: DandisetFiles;
  }>();

  useEffect(() => {
    if (!data || !dandiset) return undefined;
    let current = true;
    const settle = (files: DandisetFiles) => {
      if (current) setResult({ request, files });
    };
    Promise.all([
      fetchAssets(data.key, data.version),
      fetchElectrodes(data.key, dandiset, data.version),
    ])
      .then(([assets, electrodes]) =>
        settle({
          status: "ready",
          subjects: groupSubjects(assets[dandiset] ?? []),
          electrodes: new Map(Object.entries(electrodes ?? {})),
        }),
      )
      .catch((error: unknown) =>
        settle({
          status: "error",
          message: error instanceof Error ? error.message : String(error),
        }),
      );
    return () => {
      current = false;
    };
  }, [data, dandiset, request]);

  return result?.request === request ? result.files : LOADING;
}
