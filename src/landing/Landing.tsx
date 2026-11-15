import { useEffect, useState } from "react";
import { Alert, LoadingState, Page, Section, useLoadingPhase } from "@ui";
import { dataVersion } from "../atlas/atlasData";
import {
  bySpecies,
  fetchAtlasIndex,
  type AtlasSummary,
} from "../atlas/atlasIndex";
import { dataUrl } from "../data/fetchData";
import { RouteLink } from "../RouteLink";
import "./Landing.css";

const n = (count: number) => count.toLocaleString("en-US");

type IndexState =
  | { status: "loading" }
  | { status: "ready"; atlases: AtlasSummary[] }
  | { status: "error"; message: string };

/** The first screen: what the atlas is for, and one card per atlas, grouped by species. */
export function Landing() {
  const [state, setState] = useState<IndexState>({ status: "loading" });
  const phase = useLoadingPhase(state.status === "loading");

  useEffect(() => {
    let current = true;
    dataVersion()
      .then(fetchAtlasIndex)
      .then((atlases) => current && setState({ status: "ready", atlases }))
      .catch(
        (error: unknown) =>
          current &&
          setState({
            status: "error",
            message: error instanceof Error ? error.message : String(error),
          }),
      );
    return () => {
      current = false;
    };
  }, []);

  return (
    <Page title="Neurosift Brain">
      <p className="atlas-landing-lead">
        Find data in the DANDI Archive by brain region, on the maps of DANDI
        Atlas. Pick an atlas to see which regions have recordings, then open the
        dandisets, subjects and sessions behind them.
      </p>
      {state.status === "loading" && (
        <LoadingState label="Loading atlases" phase={phase} />
      )}
      {state.status === "error" && (
        <Alert status="error" title="The atlases didn't load">
          {state.message}
        </Alert>
      )}
      {state.status === "ready" &&
        bySpecies(state.atlases).map((group) => (
          <Section key={group.species} title={group.species}>
            <ul className="atlas-cards">
              {group.atlases.map((atlas) => (
                <li key={atlas.key}>
                  <RouteLink
                    className="atlas-card"
                    to={{
                      page: "atlas",
                      atlas: atlas.key,
                      regions: [],
                      comparing: false,
                    }}
                  >
                    <img
                      className="atlas-card-image"
                      src={dataUrl(atlas.preview.replace(/^data\//, ""))}
                      alt=""
                    />
                    <span className="atlas-card-name">{atlas.name}</span>
                    <dl className="atlas-card-stats">
                      <div>
                        <dt>Dandisets</dt>
                        <dd>{n(atlas.dandiset_count)}</dd>
                      </div>
                      <div>
                        <dt>NWB files</dt>
                        <dd>{n(atlas.file_count)}</dd>
                      </div>
                      <div>
                        <dt>Regions with data</dt>
                        <dd>{n(atlas.regions_with_data)}</dd>
                      </div>
                    </dl>
                  </RouteLink>
                </li>
              ))}
            </ul>
          </Section>
        ))}
    </Page>
  );
}
