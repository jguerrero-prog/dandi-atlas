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
import { BrainScene, type SceneHover } from "../scene/BrainScene";
import { VIEWS } from "../scene/views";
import { usePlotColors, usePlotTheme } from "../shared/plotTheme";
import { HoverReadout } from "./HoverReadout";
import "./Viewer.css";

interface ViewerProps {
  config: AtlasConfig;
  data: AtlasData;
  /** The region in focus; null shows the whole brain. */
  selectedId: number | null;
  onPick: (id: number) => void;
}

/** The 3D brain with its controls: views, opacity, the view's own Light/Dark switch and help. */
export function Viewer({ config, data, selectedId, onPick }: ViewerProps) {
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
  const [hover, setHover] = useState<SceneHover | null>(null);
  const [regionOpacity, setRegionOpacity] = useState(100);
  const colors = usePlotColors();
  const { plotTheme, onPlotThemeChange } = usePlotTheme();

  useEffect(() => {
    const element = canvas.current;
    const brain = element
      ? new BrainScene(element, {
          onHover: setHover,
          onPick: (id) => pick.current(id),
        })
      : null;
    scene.current = brain;
    return () => {
      brain?.dispose();
      scene.current = null;
    };
  }, []);

  useEffect(() => {
    scene.current?.setColors({
      background: colors.surface,
      outline: colors.textMuted,
      electrode: colors.cursor,
    });
  }, [colors]);

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
    if (selectedId === null) brain?.showWholeBrain();
    else void brain?.spotlight(selectedId);
  }, [selectedId]);

  useEffect(
    () => scene.current?.setRegionOpacity(regionOpacity / 100),
    [regionOpacity],
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
      plotTheme={plotTheme}
      onPlotThemeChange={onPlotThemeChange}
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
          <Toggletip title="How to move the brain">
            Drag to rotate, scroll to zoom and right-drag to pan. Click a region
            to select it.
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
      <div className="atlas-viewer-stage">
        <canvas
          ref={canvas}
          className="atlas-viewer-canvas"
          aria-label={`3D view of the ${config.name} atlas`}
        />
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
