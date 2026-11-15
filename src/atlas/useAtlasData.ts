import { useEffect, useState } from "react";
import { dataVersion, loadAtlasData, type AtlasData } from "./atlasData";
import type { AtlasKey } from "./configs";

export type AtlasState =
  | { status: "loading" }
  | { status: "ready"; data: AtlasData }
  | { status: "error"; message: string };

const LOADING: AtlasState = { status: "loading" };

/** Loads an atlas's files. A result counts only for the request that made it, so a newer request reads as loading. */
export function useAtlasData(key: AtlasKey, attempt = 0): AtlasState {
  const request = `${key}#${attempt}`;
  const [result, setResult] = useState<{
    request: string;
    state: AtlasState;
  }>();

  useEffect(() => {
    let current = true;
    const settle = (state: AtlasState) => {
      if (current) setResult({ request, state });
    };
    dataVersion()
      .then((version) => loadAtlasData(key, version))
      .then((data) => settle({ status: "ready", data }))
      .catch((error: unknown) =>
        settle({
          status: "error",
          message: error instanceof Error ? error.message : String(error),
        }),
      );
    return () => {
      current = false;
    };
  }, [key, request]);

  return result?.request === request ? result.state : LOADING;
}
