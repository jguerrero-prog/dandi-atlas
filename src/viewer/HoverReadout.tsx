import { useLayoutEffect, useRef } from "react";
import type { AtlasConfig } from "../atlas/configs";
import { regionTotals, type AtlasData } from "../atlas/atlasData";
import type { SceneHover } from "../scene/BrainScene";
import "./HoverReadout.css";

const plural = (count: number, word: string) =>
  `${count.toLocaleString("en-US")} ${word}${count === 1 ? "" : "s"}`;
const coord = (value: number) =>
  Number.isInteger(value) ? String(value) : value.toFixed(1);

/** What is under the pointer in the 3D view: a region and its coverage, or an electrode and where it sits. */
export function HoverReadout({
  hover,
  data,
  config,
}: {
  hover: SceneHover;
  data: AtlasData;
  config: AtlasConfig;
}) {
  const tip = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    tip.current?.style.setProperty("--atlas-hover-x", `${hover.x}px`);
    tip.current?.style.setProperty("--atlas-hover-y", `${hover.y}px`);
  }, [hover.x, hover.y]);

  let title: string;
  let lines: string[];
  if (hover.kind === "electrode") {
    title = hover.point.label;
    lines = [`${config.coordLabel} ${hover.point.coord.map(coord).join(", ")}`];
  } else {
    const region = data.regions.get(hover.id);
    const structure = data.structures.get(hover.id);
    title = region?.name ?? structure?.name ?? "Unnamed region";
    const acronym = region?.acronym ?? structure?.acronym;
    const totals = region ? regionTotals(region) : null;
    lines = [
      ...(acronym && acronym !== title && acronym !== "root" ? [acronym] : []),
      totals
        ? `${plural(totals.dandisets, "dandiset")}, ${plural(totals.files, "file")}`
        : "No DANDI data here",
    ];
  }

  return (
    <div ref={tip} className="atlas-hover" aria-hidden="true">
      <p className="atlas-hover-title">{title}</p>
      {lines.map((line) => (
        <p className="atlas-hover-line" key={line}>
          {line}
        </p>
      ))}
    </div>
  );
}
