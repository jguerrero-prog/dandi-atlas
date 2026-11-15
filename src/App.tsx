import { useEffect, useState } from "react";
import { Alert, AppBar, LoadingState, StatusBar, useLoadingPhase } from "@ui";
import { ATLASES, isAtlasKey, type AtlasKey } from "./atlas/configs";
import { useAtlasData } from "./atlas/useAtlasData";
import { RegionSummary } from "./RegionSummary";
import { Viewer } from "./viewer/Viewer";
import { applyTheme, THEME_OPTIONS, useThemeChoice } from "./theme";
import {
  PLOT_THEME_OPTIONS,
  setPlotTheme,
  usePlotThemeChoice,
} from "./shared/plotTheme";
import { fetchLastUpdated } from "./data/fetchData";
import { Credits } from "./Credits";
import "./App.css";

const BASE = import.meta.env.BASE_URL;

/** The atlas named in ?atlas=, as the original viewer's links use; Allen CCF otherwise. */
const requestedAtlas = (): AtlasKey => {
  const requested = new URLSearchParams(window.location.search).get("atlas");
  return isAtlasKey(requested) ? requested : "allen_ccf";
};

const formatUpdated = (timestamp: string) =>
  new Date(timestamp).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

export function App() {
  const theme = useThemeChoice();
  const viewTheme = usePlotThemeChoice();
  const [updated, setUpdated] = useState<string>();
  const [atlasKey] = useState(requestedAtlas);
  const [attempt, setAttempt] = useState(0);
  const atlas = useAtlasData(atlasKey, attempt);
  const loadingPhase = useLoadingPhase(atlas.status === "loading");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const config = ATLASES[atlasKey];

  useEffect(() => {
    fetchLastUpdated()
      .then((data) => setUpdated(formatUpdated(data.timestamp)))
      .catch(() => setUpdated(undefined));
  }, []);

  const displayMenu = [
    {
      label: "Theme",
      items: THEME_OPTIONS.map(({ value, label }) => ({
        label,
        checked: theme === value,
        onSelect: () => applyTheme(value),
      })),
    },
    {
      label: "3D view",
      items: PLOT_THEME_OPTIONS.map(({ value, label }) => ({
        label,
        checked: viewTheme === value,
        onSelect: () => setPlotTheme(value),
      })),
    },
  ];

  return (
    <div className="atlas-app">
      <AppBar
        homeHref={BASE}
        logo={
          <img
            src={`${BASE}neurosift-logo.png`}
            alt=""
            className="atlas-app-logo"
          />
        }
        name="DANDI Atlas"
        actions={[
          {
            label: "Display",
            icon: "light",
            collapses: true,
            menu: displayMenu,
          },
          {
            label: "Original viewer",
            href: `${BASE}legacy/index.html`,
            icon: "launch",
            collapses: true,
          },
          {
            label: "View the code on GitHub",
            href: "https://github.com/jguerrero-prog/dandi-atlas",
            icon: "logo--github",
            iconOnly: true,
            external: true,
          },
        ]}
      />
      <main className="atlas-main">
        <aside className="atlas-panel" aria-label="Brain regions" />
        <section className="atlas-viewer" aria-label="3D view">
          {atlas.status === "ready" && (
            <Viewer
              config={config}
              data={atlas.data}
              selectedId={selectedId}
              onPick={setSelectedId}
            />
          )}
          {atlas.status === "loading" && (
            <LoadingState
              label={`Loading the ${config.name} atlas`}
              phase={loadingPhase}
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
          {atlas.status === "ready" && (
            <RegionSummary
              data={atlas.data}
              selectedId={selectedId}
              onClear={() => setSelectedId(null)}
            />
          )}
        </aside>
      </main>
      <StatusBar
        version="DANDI Atlas"
        items={updated ? [`Data updated ${updated}`] : []}
        details={<Credits />}
      />
    </div>
  );
}
