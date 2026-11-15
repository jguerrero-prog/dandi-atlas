import { Button, DescriptionList, RemovableTag } from "@ui";
import {
  regionDandisets,
  regionTotals,
  type AtlasData,
} from "../atlas/atlasData";
import type { AtlasConfig } from "../atlas/configs";
import { regionAcronym, regionName } from "../regions/regionTree";
import { DandisetList, type DandisetItem } from "./DandisetList";
import "./Details.css";

interface RegionDetailsProps {
  config: AtlasConfig;
  data: AtlasData;
  titles: ReadonlyMap<string, string>;
  selectedIds: readonly number[];
  comparing: boolean;
  onSelect: (ids: number[]) => void;
  onCompare: (comparing: boolean) => void;
}

const n = (count: number) => count.toLocaleString("en-US");

/** The selected region, or the regions being compared, and the dandisets that record there. */
export function RegionDetails(props: RegionDetailsProps) {
  return props.comparing ? (
    <CompareDetails {...props} />
  ) : (
    <SingleDetails {...props} />
  );
}

function SingleDetails({
  config,
  data,
  titles,
  selectedIds,
  onSelect,
  onCompare,
}: RegionDetailsProps) {
  const rootId = data.manifest.root_id;
  const id = selectedIds.at(-1) ?? rootId;
  const region = data.regions.get(id);
  const totals = region ? regionTotals(region) : null;
  const acronym = regionAcronym(data, id);
  const atlasLink =
    config.regionLinkTemplate && id !== rootId
      ? config.regionLinkTemplate.replace("{id}", String(id))
      : null;
  const items: DandisetItem[] = region
    ? regionDandisets(region).map(({ id: dandiset, direct }) => ({
        id: dandiset,
        note:
          id === rootId
            ? ""
            : direct
              ? "Recorded in this region"
              : "Recorded in its subregions",
      }))
    : [];

  return (
    <div className="atlas-details">
      <header className="atlas-details-head">
        <h2 className="atlas-details-title">{regionName(data, id)}</h2>
        {acronym && <p className="atlas-details-acronym">{acronym}</p>}
        {atlasLink && (
          <a
            href={atlasLink}
            target="_blank"
            rel="noreferrer"
            className="atlas-details-link"
          >
            View in the Allen Brain Atlas
          </a>
        )}
      </header>
      <DescriptionList
        label="Coverage, including subregions"
        items={[
          {
            term: "Dandisets",
            value: totals ? n(totals.dandisets) : undefined,
            missing: "none",
          },
          {
            term: "NWB files",
            value: totals ? n(totals.files) : undefined,
            missing: "none",
          },
        ]}
      />
      <div className="atlas-details-actions">
        {id !== rootId && (
          <Button size="sm" onClick={() => onSelect([])}>
            Show whole brain
          </Button>
        )}
        <Button size="sm" onClick={() => onCompare(true)}>
          Compare regions
        </Button>
      </div>
      <h3 className="atlas-details-subtitle">Dandisets</h3>
      <DandisetList key={id} items={items} data={data} titles={titles} />
    </div>
  );
}

function CompareDetails({
  data,
  titles,
  selectedIds,
  onSelect,
  onCompare,
}: RegionDetailsProps) {
  const rootId = data.manifest.root_id;
  const ids = selectedIds.filter((id) => id !== rootId);
  // Each dandiset once, with the compared regions it records in.
  const covers = new Map<string, string[]>();
  for (const id of ids) {
    const region = data.regions.get(id);
    if (!region) continue;
    for (const { id: dandiset } of regionDandisets(region)) {
      covers.set(dandiset, [
        ...(covers.get(dandiset) ?? []),
        regionAcronym(data, id) ?? regionName(data, id),
      ]);
    }
  }
  const items = [...covers]
    .toSorted((a, b) => b[1].length - a[1].length)
    .map(([dandiset, regions]) => ({
      id: dandiset,
      note:
        regions.length === ids.length && ids.length > 1
          ? "Records in every compared region"
          : `Records in ${regions.join(", ")}`,
    }));

  return (
    <div className="atlas-details">
      <header className="atlas-details-head">
        <h2 className="atlas-details-title">
          {ids.length === 0
            ? "Compare regions"
            : `Comparing ${ids.length} region${ids.length === 1 ? "" : "s"}`}
        </h2>
        <p className="atlas-details-help">
          Choose regions in the tree or the brain to add them. Choose one again
          to take it out.
        </p>
      </header>
      {ids.length > 0 && (
        <ul className="atlas-details-tags" aria-label="Compared regions">
          {ids.map((id) => (
            <li key={id}>
              <RemovableTag
                label={regionName(data, id)}
                onRemove={() => onSelect(ids.filter((other) => other !== id))}
              />
            </li>
          ))}
        </ul>
      )}
      <div className="atlas-details-actions">
        <Button size="sm" onClick={() => onCompare(false)}>
          Done comparing
        </Button>
      </div>
      <h3 className="atlas-details-subtitle">Dandisets</h3>
      <DandisetList
        key={ids.join(",")}
        items={items}
        data={data}
        titles={titles}
      />
    </div>
  );
}
