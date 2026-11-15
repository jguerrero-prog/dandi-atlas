import { useEffect, useState } from "react";
import { AppBar, StatusBar } from "@ui";
import { applyTheme, THEME_OPTIONS, useThemeChoice } from "./theme";
import { fetchLastUpdated } from "./data/fetchData";
import { Credits } from "./Credits";
import { Landing } from "./landing/Landing";
import { useRoute } from "./route";
import { Workspace } from "./Workspace";
import "./App.css";

const BASE = import.meta.env.BASE_URL;

const formatUpdated = (timestamp: string) =>
  new Date(timestamp).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

/** The shell every page shares: Neurosift's app bar, the page, and the status bar with credits. */
export function App() {
  const route = useRoute();
  const theme = useThemeChoice();
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
      {route.page === "landing" ? (
        <main className="atlas-page">
          <Landing />
        </main>
      ) : (
        <Workspace route={route} />
      )}
      <StatusBar
        version="DANDI Atlas"
        items={updated ? [`Data updated ${updated}`] : []}
        details={<Credits />}
      />
    </div>
  );
}
