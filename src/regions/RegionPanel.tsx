import { useEffect, useMemo, useState } from "react";
import { Checkbox, SearchField, Select, Tree } from "@ui";
import type { AtlasData } from "../atlas/atlasData";
import { ATLASES, isAtlasKey, type AtlasKey } from "../atlas/configs";
import { ancestorsOf, buildRegionTree } from "./regionTree";
import "./RegionPanel.css";

const ATLAS_OPTIONS = Object.values(ATLASES).map((atlas) => ({
  value: atlas.key,
  label: `${atlas.name} (${atlas.species})`,
}));

interface RegionPanelProps {
  atlas: AtlasKey;
  data: AtlasData;
  selectedIds: readonly number[];
  onAtlasChange: (atlas: AtlasKey) => void;
  onSelect: (id: number) => void;
}

const union = (a: string[], b: Iterable<string>) => [...new Set([...a, ...b])];

/** The atlas switch, region search and the hierarchy. Choosing a row selects the region; its chevron opens it. */
export function RegionPanel({
  atlas,
  data,
  selectedIds,
  onAtlasChange,
  onSelect,
}: RegionPanelProps) {
  const [query, setQuery] = useState("");
  const [showEmpty, setShowEmpty] = useState(false);
  const rootId = data.manifest.root_id;
  const [expanded, setExpanded] = useState<string[]>([String(rootId)]);
  const selection = selectedIds.join(",");
  const keep = useMemo(
    () => new Set(selection ? selection.split(",").map(Number) : []),
    [selection],
  );
  const tree = useMemo(
    () => buildRegionTree(data, { query, showEmpty, keep }),
    [data, query, showEmpty, keep],
  );

  // A region chosen in the brain, or a new search, opens the path to it. Adjusted while rendering, so it shows at once.
  const [opened, setOpened] = useState({ selection: "", query: "" });
  if (opened.selection !== selection || opened.query !== query) {
    setOpened({ selection, query });
    const paths = [...keep].flatMap((id) => ancestorsOf(data, id)).map(String);
    setExpanded(union(expanded, [...paths, ...(query ? tree.open : [])]));
  }

  const current = selectedIds.at(-1) ?? rootId;
  useEffect(() => {
    document
      .getElementById(`tree-${current}`)
      ?.scrollIntoView({ block: "nearest" });
  }, [current]);

  return (
    <div className="atlas-regions">
      <div className="atlas-regions-head">
        <Select
          label="Atlas"
          size="sm"
          value={atlas}
          options={ATLAS_OPTIONS}
          onChange={(value) => isAtlasKey(value) && onAtlasChange(value)}
        />
        <SearchField
          label="Search regions"
          placeholder="Name or acronym"
          value={query}
          onChange={setQuery}
          onSearch={setQuery}
        />
        <Checkbox
          label="Show regions without data"
          checked={showEmpty}
          onChange={setShowEmpty}
        />
        <output className="atlas-regions-note">
          {query
            ? `${tree.matches.toLocaleString("en-US")} ${tree.matches === 1 ? "region matches" : "regions match"}`
            : "Numbers are dandisets, including subregions."}
        </output>
      </div>
      <div className="atlas-regions-tree">
        <Tree
          label="Brain regions"
          nodes={tree.nodes}
          expanded={expanded}
          onExpandedChange={setExpanded}
          selected={String(current)}
          onSelect={(id) => onSelect(Number(id))}
          expandOnSelect={false}
        />
      </div>
    </div>
  );
}
