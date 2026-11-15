import { useMemo, useState } from "react";
import { Alert, LoadingState, useLoadingPhase } from "@ui";
import { ATLASES, type AtlasKey } from "./atlas/configs";
import { useAtlasData } from "./atlas/useAtlasData";
import { useDandisetTitles } from "./atlas/useDandisetTitles";
import { subjectCounts } from "./dandisets/dandisetModel";
import { dandisetView } from "./dandisets/dandisetView";
import { useDandisetFiles } from "./dandisets/useDandisetFiles";
import { DandisetDetails } from "./details/DandisetDetails";
import { RegionDetails } from "./details/RegionDetails";
import { RegionPanel } from "./regions/RegionPanel";
import { navigate, routeHref, type Route } from "./route";
import { plotColors } from "./shared/plotColors";
import { Viewer } from "./viewer/Viewer";

const changeAtlas = (key: AtlasKey) =>
  navigate({ page: "atlas", atlas: key, regions: [], comparing: false });

/** One atlas: regions on the left, the brain in the middle, details on the right. */
export function Workspace({ route }: { route: Route }) {
  const config = ATLASES[route.atlas];
  const [attempt, setAttempt] = useState(0);
  const atlas = useAtlasData(route.atlas, attempt);
  const titles = useDandisetTitles();
  const phase = useLoadingPhase(atlas.status === "loading");
  const data = atlas.status === "ready" ? atlas.data : null;
  const dandiset =
    data && route.dandiset && data.dandisetRegions.has(route.dandiset)
      ? route.dandiset
      : undefined;
  const files = useDandisetFiles(data, dandiset);

  // Links can name regions this atlas doesn't have; drop them rather than spotlight nothing.
  const selectedIds = data
    ? route.regions.filter((id) => data.structures.has(id))
    : route.regions;
  const rootId = data?.manifest.root_id;

  // Hidden regions belong to one dandiset; opening another shows everything again.
  const [hidden, setHidden] = useState<{
    dandiset: string | undefined;
    ids: ReadonlySet<number>;
  }>({ dandiset, ids: new Set() });
  if (hidden.dandiset !== dandiset) setHidden({ dandiset, ids: new Set() });

  const regionFilter = selectedIds.at(0);
  const view = useMemo(
    () =>
      data && dandiset && files.status === "ready"
        ? dandisetView({
            data,
            coordSystem: config.coordSystem,
            dandiset,
            subjects: files.subjects,
            electrodes: files.electrodes,
            regionFilter,
            subjectDir: route.subject,
            sessionId: route.session,
            hidden: hidden.ids,
            // The 3D view is always dark, so sessions take the dark series colors.
            sessionColors: plotColors("dark").series,
          })
        : null,
    [
      data,
      dandiset,
      files,
      config,
      regionFilter,
      route.subject,
      route.session,
      hidden.ids,
    ],
  );

  const scope = useMemo(
    () =>
      data && dandiset && files.status === "ready"
        ? {
            ids: new Set(data.dandisetRegions.get(dandiset)),
            counts: subjectCounts(files.subjects),
          }
        : undefined,
    [data, dandiset, files],
  );

  const show = (regions: number[], comparing = route.comparing) =>
    navigate({
      ...route,
      regions,
      comparing,
      dandiset: undefined,
      subject: undefined,
      session: undefined,
    });

  /** Within a dandiset: a subject, a session or a region filter, as a new history entry. */
  const go = (next: {
    regions?: number[];
    subject?: string;
    session?: string;
  }) =>
    navigate({
      ...route,
      comparing: false,
      regions: next.regions ?? (next.subject ? [] : route.regions),
      subject: next.subject,
      session: next.session,
    });

  /**
   * From the tree or the brain. Inside a dandiset it filters to the region, or clears the filter when
   * chosen again. Otherwise it replaces the selection, or in compare mode adds or takes out a region.
   */
  const choose = (id: number) => {
    if (dandiset)
      return go({
        regions: id === rootId || selectedIds[0] === id ? [] : [id],
      });
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

  const dandisetHref = (id: string) =>
    routeHref({
      ...route,
      regions: [],
      comparing: false,
      dandiset: id,
      subject: undefined,
      session: undefined,
    });

  // Until a dandiset's subjects load, spotlight all its regions.
  const focusIds = dandiset
    ? (view?.focusIds ?? data?.dandisetRegions.get(dandiset) ?? [])
    : selectedIds;

  return (
    <main className="atlas-main">
      <aside className="atlas-panel" aria-label="Brain regions">
        {data && (
          <RegionPanel
            key={route.atlas}
            atlas={route.atlas}
            data={data}
            selectedIds={dandiset ? selectedIds.slice(0, 1) : selectedIds}
            onAtlasChange={changeAtlas}
            onSelect={choose}
            scope={scope}
          />
        )}
      </aside>
      <section className="atlas-viewer" aria-label="3D view">
        {data && (
          <Viewer
            config={config}
            data={data}
            selectedIds={focusIds}
            onPick={choose}
            electrodes={view?.electrodes}
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
        {data && dandiset && (
          <DandisetDetails
            route={{ ...route, dandiset }}
            data={data}
            titles={titles}
            files={files}
            view={view}
            hidden={hidden.ids}
            onHiddenChange={(ids) => setHidden({ dandiset, ids })}
            onGo={go}
          />
        )}
        {data && !dandiset && (
          <RegionDetails
            config={config}
            data={data}
            titles={titles}
            selectedIds={selectedIds}
            comparing={route.comparing}
            onSelect={(regions) => show(regions)}
            onCompare={compare}
            dandisetHref={dandisetHref}
          />
        )}
      </aside>
    </main>
  );
}
