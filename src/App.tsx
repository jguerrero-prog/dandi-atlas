import { useEffect, useState } from "react";
import { AppBar, EmptyState, StatusBar } from "@ui";
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
          <EmptyState title="The 3D view is being rebuilt">
            This preview has the new layout only. The original viewer is still
            available from the app bar.
          </EmptyState>
        </section>
        <aside className="atlas-panel" aria-label="Details" />
      </main>
      <StatusBar
        version="DANDI Atlas"
        items={updated ? [`Data updated ${updated}`] : []}
        details={<Credits />}
      />
    </div>
  );
}
