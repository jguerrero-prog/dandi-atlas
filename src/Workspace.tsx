import { useState } from "react";
import { Alert, LoadingState, useLoadingPhase } from "@ui";
import { ATLASES, type AtlasKey } from "./atlas/configs";
import { useAtlasData } from "./atlas/useAtlasData";
import { useDandisetTitles } from "./atlas/useDandisetTitles";
import { RegionDetails } from "./details/RegionDetails";
import { RegionPanel } from "./regions/RegionPanel";
import { navigate, type Route } from "./route";
import { Viewer } from "./viewer/Viewer";

type AtlasRoute = Extract<Route, { page: "atlas" }>;

const changeAtlas = (key: AtlasKey) =>
  navigate({ page: "atlas", atlas: key, regions: [], comparing: false });

/** One atlas: regions on the left, the brain in the middle, details on the right. */
export function Workspace({ route }: { route: AtlasRoute }) {
  const config = ATLASES[route.atlas];
  const [attempt, setAttempt] = useState(0);
  const atlas = useAtlasData(route.atlas, attempt);
  const titles = useDandisetTitles();
  const phase = useLoadingPhase(atlas.status === "loading");
  const data = atlas.status === "ready" ? atlas.data : null;

  // Links can name regions this atlas doesn't have; drop them rather than spotlight nothing.
  const selectedIds = data
    ? route.regions.filter((id) => data.structures.has(id))
    : route.regions;
  const rootId = data?.manifest.root_id;

  const show = (regions: number[], comparing = route.comparing) =>
    navigate({
      ...route,
      regions,
      comparing,
      dandiset: undefined,
      subject: undefined,
      session: undefined,
    });

  /** From the tree or the brain: replaces the selection, or in compare mode adds or takes out a region. */
  const choose = (id: number) => {
    if (!route.comparing) return show(id === rootId ? [] : [id]);
    if (id === rootId) return;
    show(
      selectedIds.includes(id)
        ? selectedIds.filter((other) => other !== id)
        : [...selectedIds, id],
    );
  };

  const compare = (comparing: boolean) =>
    show(comparing ? selectedIds : selectedIds.slice(-1), comparing);
  return (
    <main className="atlas-main">
      <aside className="atlas-panel" aria-label="Brain regions">
        {data && (
          <RegionPanel
            key={route.atlas}
            atlas={route.atlas}
            data={data}
            selectedIds={selectedIds}
            onAtlasChange={changeAtlas}
            onSelect={choose}
          />
        )}
      </aside>
      <section className="atlas-viewer" aria-label="3D view">
        {data && (
          <Viewer
            config={config}
            data={data}
            selectedIds={selectedIds}
            onPick={choose}
          />
        )}
        {atlas.status === "loading" && (
          <LoadingState
            label={`Loading the ${config.name} atlas`}
            phase={phase}
          />
        )}
        {atlas.status === "error" && (
          <div className="atlas-viewer-error">
            <Alert
              status="error"
              title="The atlas didn't load"
              actions={[
                {
                  label: "Try again",
                  onClick: () => setAttempt((count) => count + 1),
                },
              ]}
            >
              {atlas.message}
            </Alert>
          </div>
        )}
      </section>
      <aside className="atlas-panel" aria-label="Details">
        {data && (
          <RegionDetails
            config={config}
            data={data}
            titles={titles}
            selectedIds={selectedIds}
            comparing={route.comparing}
            onSelect={(regions) => show(regions)}
            onCompare={compare}
          />
        )}
      </aside>
    </main>
  );
}
