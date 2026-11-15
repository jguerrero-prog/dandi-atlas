import { useEffect, useRef, useState } from "react";
import {
  IconButton,
  Menu,
  ProgressBar,
  Slider,
  Toggletip,
  ViewPanel,
} from "@ui";
import type { AtlasData } from "../atlas/atlasData";
import type { AtlasConfig } from "../atlas/configs";
import {
  BrainScene,
  type ElectrodePoint,
  type SceneHover,
} from "../scene/BrainScene";
import { VIEWS } from "../scene/views";
import { plotColors } from "../shared/plotColors";
import { HoverReadout } from "./HoverReadout";
import "./Viewer.css";

interface ViewerProps {
  config: AtlasConfig;
  data: AtlasData;
  /** The regions in focus; none shows the whole brain. */
  selectedIds: readonly number[];
  onPick: (id: number) => void;
  /** Electrode positions to draw, for a subject or a session. */
  electrodes?: readonly ElectrodePoint[];
}

const NO_ELECTRODES: readonly ElectrodePoint[] = [];

/** The keys the 3D view takes once it has focus; also read to screen readers as its description. */
const KEYS =
  "With the 3D view focused: arrow keys rotate, Shift and arrows pan, + and − zoom, Home resets, and 1 to 6 pick Top, Bottom, Front, Back, Left and Right.";
/** Regions drop to this opacity when electrodes appear, so the meshes don't hide them. */
const ELECTRODE_VIEW_OPACITY = 50;

/** The 3D brain with its controls: views, opacity, the view's own Light/Dark switch and help. */
export function Viewer({
  config,
  data,
  selectedIds,
  onPick,
  electrodes = NO_ELECTRODES,
}: ViewerProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const scene = useRef<BrainScene | null>(null);
  const pick = useRef(onPick);
  useEffect(() => {
    pick.current = onPick;
  });
  // Progress belongs to the atlas it was reported for, so one atlas's count never shows for the next.
  const [progress, setProgress] = useState<{
    data: AtlasData;
    loaded: number;
    total: number;
  }>();
  const selection = selectedIds.join(",");
  const [hover, setHover] = useState<SceneHover | null>(null);
  const [regionOpacity, setRegionOpacity] = useState(100);
  const [electrodeOpacity, setElectrodeOpacity] = useState(100);

  // When electrodes appear, regions drop to half so the dots show; when they go, the old opacity comes back,
  // unless people moved the slider meanwhile. Adjusted while rendering, so the scene never draws the gap.
  const hasElectrodes = electrodes.length > 0;
  const [drop, setDrop] = useState<{ on: boolean; before: number | null }>({
    on: false,
    before: null,
  });
  if (drop.on !== hasElectrodes) {
    if (hasElectrodes && regionOpacity > ELECTRODE_VIEW_OPACITY) {
      setDrop({ on: true, before: regionOpacity });
      setRegionOpacity(ELECTRODE_VIEW_OPACITY);
    } else if (
      !hasElectrodes &&
      drop.before !== null &&
      regionOpacity === ELECTRODE_VIEW_OPACITY
    ) {
      setRegionOpacity(drop.before);
      setDrop({ on: false, before: null });
    } else setDrop({ on: hasElectrodes, before: null });
  }

  useEffect(() => {
    const element = canvas.current;
    const brain = element
      ? new BrainScene(element, {
          onHover: setHover,
          onPick: (id) => pick.current(id),
        })
      : null;
    // The 3D view is always dark, whatever the app theme: pale meshes and electrodes read best on it.
    const colors = plotColors("dark");
    brain?.setColors({
      background: colors.surface,
      outline: colors.textMuted,
      electrode: colors.cursor,
    });
    scene.current = brain;
    return () => {
      brain?.dispose();
      scene.current = null;
    };
  }, []);

  useEffect(() => {
    let current = true;
    void scene.current?.setAtlas(config, data, (loaded, total) => {
      if (current) setProgress({ data, loaded, total });
    });
    return () => {
      current = false;
    };
  }, [config, data]);

  useEffect(() => {
    const brain = scene.current;
    // Keyed by value, so a new array with the same regions doesn't re-run it.
    const ids = selection ? selection.split(",").map(Number) : [];
    if (ids.length === 0) brain?.showWholeBrain();
    else void brain?.spotlight(ids);
  }, [selection]);

  useEffect(
    () => scene.current?.setRegionOpacity(regionOpacity / 100),
    [regionOpacity],
  );

  useEffect(() => scene.current?.showElectrodes([...electrodes]), [electrodes]);

  useEffect(
    () => scene.current?.setElectrodeOpacity(electrodeOpacity / 100),
    [electrodeOpacity],
  );

  const loading =
    progress?.data === data && progress.loaded < progress.total
      ? progress
      : null;
  // Regions with files of their own, the count the pipeline publishes; parents count only through children.
  const regionsWithData = [...data.regions.values()].filter(
    (region) => region.file_count > 0,
  ).length;

  return (
    <ViewPanel
      label={`${config.name} 3D view`}
      summary={`${config.name}, ${config.species.toLowerCase()}: ${regionsWithData.toLocaleString("en-US")} regions with DANDI data.`}
      plotTheme="dark"
      busy={Boolean(loading)}
      controls={
        <>
          <Menu
            label="View"
            icon="view"
            size="sm"
            items={VIEWS.map((view) => ({
              label: view.label,
              meta: view.meta === view.label ? undefined : view.meta,
              onSelect: () => scene.current?.setView(view.value),
            }))}
          />
          <IconButton
            icon="reset"
            label="Reset view"
            size="sm"
            tooltip
            onClick={() => scene.current?.resetView()}
          />
          <div className="atlas-viewer-opacity">
            <Slider
              label="Regions"
              min={0}
              max={100}
              step={5}
              unit="%"
              unitName="percent opacity"
              value={regionOpacity}
              onChange={setRegionOpacity}
              showField={false}
            />
          </div>
          {hasElectrodes && (
            <div className="atlas-viewer-opacity">
              <Slider
                label="Electrodes"
                min={0}
                max={100}
                step={5}
                unit="%"
                unitName="percent opacity"
                value={electrodeOpacity}
                onChange={setElectrodeOpacity}
                showField={false}
              />
            </div>
          )}
          <Toggletip title="How to move the brain">
            <p>
              Drag to rotate, scroll to zoom and right-drag to pan. Click a
              region to select it.
            </p>
            <p>{KEYS}</p>
          </Toggletip>
          <a
            className="atlas-viewer-attribution"
            href={config.attributionUrl}
            target="_blank"
            rel="noreferrer"
          >
            Atlas: {config.attribution}
          </a>
        </>
      }
    >
      {/* An application, so screen readers pass the arrow keys through to the scene. */}
      <div
        className="atlas-viewer-stage"
        role="application"
        tabIndex={0}
        aria-label={`3D view of the ${config.name} atlas`}
        aria-describedby="atlas-viewer-keys"
      >
        <canvas ref={canvas} className="atlas-viewer-canvas" />
        <p id="atlas-viewer-keys" className="ns-visually-hidden">
          {KEYS}
        </p>
        {loading && (
          <div className="atlas-viewer-progress">
            <ProgressBar
              label="Loading regions"
              value={loading.loaded}
              max={loading.total}
              unit="regions"
            />
          </div>
        )}
        {hover && <HoverReadout hover={hover} data={data} config={config} />}
      </div>
    </ViewPanel>
  );
}
