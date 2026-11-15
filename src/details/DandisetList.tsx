import { useState } from "react";
import { ResultRow, ShowMore } from "@ui";
import type { AtlasData } from "../atlas/atlasData";
import "./Details.css";

const PAGE = 20;

export interface DandisetItem {
  id: string;
  /** How the dandiset relates to the selection, such as "Recorded here". */
  note: string;
}

const plural = (count: number, word: string) =>
  `${count.toLocaleString("en-US")} ${word}${count === 1 ? "" : "s"}`;

/** Dandisets as Neurosift's catalog lists them, 20 at a time. */
export function DandisetList({
  items,
  data,
  titles,
  href,
}: {
  items: DandisetItem[];
  data: AtlasData;
  titles: ReadonlyMap<string, string>;
  /** Where a dandiset opens: inside the atlas, with its subjects and sessions. */
  href: (id: string) => string;
}) {
  const [shown, setShown] = useState(PAGE);
  if (items.length === 0)
    return <p className="atlas-details-empty">No dandisets record here yet.</p>;
  return (
    <>
      <ul className="atlas-dandisets" aria-label="Dandisets">
        {items.slice(0, shown).map(({ id, note }) => (
          <ResultRow
            key={id}
            archive="DANDI"
            id={id}
            title={titles.get(id) ?? `Dandiset ${id}`}
            href={href(id)}
            meta={`${plural(data.dandisetRegions.get(id)?.length ?? 0, "region")} in this atlas`}
            modified={note}
            types={
              data.electrodeDandisets.has(id) ? ["Electrode positions"] : []
            }
          />
        ))}
      </ul>
      <ShowMore
        shown={Math.min(shown, items.length)}
        total={items.length}
        onMore={() => setShown((n) => n + PAGE)}
      />
    </>
  );
}
