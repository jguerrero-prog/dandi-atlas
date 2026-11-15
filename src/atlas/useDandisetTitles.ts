import { useEffect, useState } from "react";
import { dataVersion, fetchDandisetTitles } from "./atlasData";

const EMPTY: ReadonlyMap<string, string> = new Map();

/** Dandiset titles for every atlas, read once; ids stand in until they arrive. */
export function useDandisetTitles(): ReadonlyMap<string, string> {
  const [titles, setTitles] = useState(EMPTY);
  useEffect(() => {
    let current = true;
    dataVersion()
      .then(fetchDandisetTitles)
      .then((map) => current && setTitles(map))
      .catch(() => undefined);
    return () => {
      current = false;
    };
  }, []);
  return titles;
}
