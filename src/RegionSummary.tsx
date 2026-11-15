import { Button, DescriptionList } from "@ui";
import { regionTotals, type AtlasData } from "./atlas/atlasData";

/** The selected region's name and coverage. The full details panel replaces this in a later step. */
export function RegionSummary({
  data,
  selectedId,
  onClear,
}: {
  data: AtlasData;
  selectedId: number | null;
  onClear: () => void;
}) {
  const id = selectedId ?? data.manifest.root_id;
  const region = data.regions.get(id);
  const structure = data.structures.get(id);
  const name = region?.name ?? structure?.name ?? "Unnamed region";
  const acronym = region?.acronym ?? structure?.acronym;
  const totals = region ? regionTotals(region) : null;
  return (
    <div className="atlas-summary">
      <h2 className="atlas-summary-title">{name}</h2>
      {acronym && acronym !== name && acronym !== "root" && (
        <p className="atlas-summary-acronym">{acronym}</p>
      )}
      <DescriptionList
        label="Coverage"
        items={[
          {
            term: "Dandisets",
            value: totals?.dandisets.toLocaleString("en-US"),
            missing: "none",
          },
          {
            term: "NWB files",
            value: totals?.files.toLocaleString("en-US"),
            missing: "none",
          },
        ]}
      />
      {selectedId !== null && (
        <Button size="sm" onClick={onClear}>
          Show whole brain
        </Button>
      )}
    </div>
  );
}
