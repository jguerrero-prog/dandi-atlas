import { useState } from "react";
import {
  Alert,
  Breadcrumbs,
  Checkbox,
  DescriptionList,
  Disclosure,
  LoadingState,
  RemovableTag,
  ShowMore,
  Tag,
  useLoadingPhase,
  type Crumb,
} from "@ui";
import type { AtlasData } from "../atlas/atlasData";
import type { DandisetFiles } from "../dandisets/useDandisetFiles";
import {
  sessionName,
  sessionNames,
  type Subject,
} from "../dandisets/dandisetModel";
import type { DandisetView } from "../dandisets/dandisetView";
import { regionAcronym, regionName } from "../regions/regionTree";
import { navigateHref, routeHref, type Route } from "../route";
import "./Details.css";

type AtlasRoute = Extract<Route, { page: "atlas" }>;
const PAGE = 20;
const plural = (count: number, word: string) =>
  `${count.toLocaleString("en-US")} ${word}${count === 1 ? "" : "s"}`;

interface DandisetDetailsProps {
  route: AtlasRoute & { dandiset: string };
  data: AtlasData;
  titles: ReadonlyMap<string, string>;
  files: DandisetFiles;
  view: DandisetView | null;
  hidden: ReadonlySet<number>;
  onHiddenChange: (hidden: Set<number>) => void;
  /** Moves within the dandiset: a subject, a session or a region filter. */
  onGo: (next: {
    regions?: number[];
    subject?: string;
    session?: string;
  }) => void;
}

/** A dandiset, then a subject, then a session, with the regions in view and their electrodes. */
export function DandisetDetails({
  route,
  data,
  titles,
  files,
  view,
  hidden,
  onHiddenChange,
  onGo,
}: DandisetDetailsProps) {
  const { dandiset } = route;
  const phase = useLoadingPhase(files.status === "loading");
  const filter = route.regions[0];
  const subject = view?.subject;
  const session = view?.session;
  const title = titles.get(dandiset) ?? `Dandiset ${dandiset}`;
  const total = files.status === "ready" ? files.subjects.length : 0;

  const base = {
    ...route,
    comparing: false,
    subject: undefined,
    session: undefined,
  };
  const crumbs: Crumb[] = [
    {
      label: "All dandisets",
      href: routeHref({ ...base, regions: [], dandiset: undefined }),
    },
    {
      label: `Dandiset ${dandiset}`,
      href: subject ? routeHref({ ...base }) : undefined,
      code: true,
    },
  ];
  if (subject)
    crumbs.push({
      label: subject.name,
      href: session ? routeHref({ ...base, subject: subject.dir }) : undefined,
      code: true,
    });
  if (session && subject)
    crumbs.push({
      label:
        sessionNames(subject.assets).get(session.asset_id)?.label ??
        sessionName(session).label,
    });

  return (
    <div className="atlas-details">
      <Breadcrumbs
        items={crumbs}
        label="Dandiset path"
        onNavigate={navigateHref}
      />
      <header className="atlas-details-head">
        <h2 className="atlas-details-title">{title}</h2>
        <a
          href={`https://dandiarchive.org/dandiset/${dandiset}`}
          target="_blank"
          rel="noreferrer"
          className="atlas-details-link"
        >
          View on DANDI Archive
        </a>
      </header>
      {filter !== undefined && (
        <ul className="atlas-details-tags" aria-label="Filter">
          <li>
            <RemovableTag
              label={`In ${regionName(data, filter)}`}
              onRemove={() => onGo({ regions: [] })}
            />
          </li>
        </ul>
      )}
      <DescriptionList
        label="Dandiset in this atlas"
        items={[
          {
            term: "Subjects",
            value:
              files.status === "ready"
                ? filter === undefined
                  ? String(total)
                  : `${view?.shown.length ?? 0} of ${total}`
                : undefined,
            missing: files.status === "loading" ? "loading" : "none",
          },
          {
            term: "Regions",
            value: view ? String(view.regionIds.length) : undefined,
            missing: "none",
          },
          {
            term: "Electrode positions",
            value: data.electrodeDandisets.has(dandiset)
              ? "Yes, for some sessions"
              : undefined,
            missing: "none in this atlas",
          },
        ]}
      />
      {files.status === "loading" && (
        <LoadingState label="Loading subjects" phase={phase} />
      )}
      {files.status === "error" && (
        <Alert status="error" title="The subjects didn't load">
          {files.message}
        </Alert>
      )}
      {session && (
        <DescriptionList
          label="Session"
          layout="stacked"
          items={[
            { term: "File", value: session.path, code: true },
            { term: "Asset", value: session.asset_id, code: true },
          ]}
        />
      )}
      {view && files.status === "ready" && (
        <>
          <SubjectList
            key={`${dandiset}/${filter ?? ""}`}
            subjects={view.shown}
            files={files}
            view={view}
            onGo={onGo}
          />
          <RegionVisibility
            data={data}
            ids={view.regionIds}
            hidden={hidden}
            onChange={onHiddenChange}
          />
        </>
      )}
    </div>
  );
}

function SubjectList({
  subjects,
  files,
  view,
  onGo,
}: {
  subjects: Subject[];
  files: Extract<DandisetFiles, { status: "ready" }>;
  view: DandisetView;
  onGo: DandisetDetailsProps["onGo"];
}) {
  const chosen = view.subject ? subjects.indexOf(view.subject) : -1;
  // Open on the page that holds the chosen subject, so a link to one far down still shows it.
  const [shown, setShown] = useState(
    Math.max(PAGE, Math.ceil((chosen + 1) / PAGE) * PAGE),
  );
  const hasElectrodes = (assetId: string) =>
    (files.electrodes.get(assetId)?.length ?? 0) > 0;
  if (subjects.length === 0)
    return (
      <p className="atlas-details-empty">No subjects record in this region.</p>
    );
  return (
    <section className="atlas-subjects" aria-labelledby="atlas-subjects-title">
      <h3 className="atlas-details-subtitle" id="atlas-subjects-title">
        Subjects
      </h3>
      <ul className="atlas-subject-list">
        {subjects.slice(0, shown).map((subject) => {
          const current = subject === view.subject;
          const names = sessionNames(subject.assets);
          const sessions = new Set(
            subject.assets.map((asset) => asset.session ?? asset.path),
          ).size;
          return (
            <li key={subject.dir}>
              <button
                type="button"
                className="atlas-subject"
                aria-current={current && !view.session ? "true" : undefined}
                aria-expanded={current}
                onClick={() =>
                  onGo({
                    subject: current && !view.session ? undefined : subject.dir,
                  })
                }
              >
                <span className="atlas-subject-name">{subject.name}</span>
                <span className="atlas-subject-meta">
                  {plural(sessions, "session")}
                  {subject.assets.length > sessions
                    ? `, ${plural(subject.assets.length, "file")}`
                    : ""}
                  , {plural(subject.regionIds.size, "region")}
                </span>
                {subject.assets.some((asset) =>
                  hasElectrodes(asset.asset_id),
                ) && <Tag>Electrode positions</Tag>}
              </button>
              {current && (
                <ul
                  className="atlas-session-list"
                  aria-label={`Sessions of ${subject.name}`}
                >
                  {subject.assets.map((asset) => {
                    const name =
                      names.get(asset.asset_id) ?? sessionName(asset);
                    const color = hasElectrodes(asset.asset_id)
                      ? view.sessionColor.get(asset.asset_id)
                      : undefined;
                    return (
                      <li key={asset.asset_id}>
                        <button
                          type="button"
                          className="atlas-session"
                          title={name.hint}
                          aria-current={
                            asset === view.session ? "true" : undefined
                          }
                          onClick={() =>
                            onGo({
                              subject: subject.dir,
                              session: asset.asset_id,
                            })
                          }
                        >
                          <span
                            className="atlas-session-swatch"
                            aria-hidden="true"
                            data-empty={color ? undefined : ""}
                            ref={(dot) =>
                              dot?.style.setProperty(
                                "--atlas-session-color",
                                color ?? "",
                              )
                            }
                          />
                          <span className="atlas-session-name">
                            {name.label}
                          </span>
                          <span className="atlas-subject-meta">
                            {plural(asset.regions.length, "region")}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
      <ShowMore
        shown={Math.min(shown, subjects.length)}
        total={subjects.length}
        onMore={() => setShown((n) => n + PAGE)}
      />
    </section>
  );
}

/** Show or hide each region of the view, replacing the original viewer's checkbox overlay on the brain. */
function RegionVisibility({
  data,
  ids,
  hidden,
  onChange,
}: {
  data: AtlasData;
  ids: number[];
  hidden: ReadonlySet<number>;
  onChange: (hidden: Set<number>) => void;
}) {
  const [open, setOpen] = useState(false);
  const regions = ids
    .map((id) => {
      const acronym = regionAcronym(data, id);
      return {
        id,
        label: `${regionName(data, id)}${acronym ? ` (${acronym})` : ""}`,
      };
    })
    .toSorted((a, b) => a.label.localeCompare(b.label));
  const shownCount = ids.filter((id) => !hidden.has(id)).length;
  const all =
    shownCount === ids.length ? true : shownCount === 0 ? false : "mixed";
  const toggle = (id: number, show: boolean) => {
    const next = new Set(hidden);
    if (show) next.delete(id);
    else next.add(id);
    onChange(next);
  };
  return (
    <Disclosure
      label={`Show or hide regions (${ids.length})`}
      expandedLabel={`Hide the region list (${ids.length})`}
      open={open}
      onToggle={setOpen}
    >
      <div className="atlas-visibility">
        <Checkbox
          label="All regions"
          checked={all}
          onChange={(show) => onChange(show ? new Set() : new Set(ids))}
        />
        {regions.map((region) => (
          <Checkbox
            key={region.id}
            label={region.label}
            checked={!hidden.has(region.id)}
            onChange={(show) => toggle(region.id, show)}
          />
        ))}
      </div>
    </Disclosure>
  );
}
