import {
  AmbientLight,
  Box3,
  BufferGeometry,
  Color,
  DirectionalLight,
  DoubleSide,
  Float32BufferAttribute,
  FrontSide,
  Group,
  Mesh,
  MeshPhongMaterial,
  type Object3D,
  PerspectiveCamera,
  Points,
  PointsMaterial,
  Quaternion,
  Raycaster,
  Scene,
  ShaderMaterial,
  Spherical,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MESH_VERSION, type AtlasData } from "../atlas/atlasData";
import type { AtlasConfig } from "../atlas/configs";
import { dataUrl } from "../data/fetchData";
import {
  baseLook,
  decideDisplayMode,
  initialMeshIds,
  modeLook,
  type BaseLook,
  type DisplayMode,
} from "./displayMode";
import { cameraFor, VIEWS, type ViewName } from "./views";

/** Colors the scene takes from the 3D view's theme tokens. */
export interface SceneColors {
  background: string;
  outline: string;
  electrode: string;
}

export interface ElectrodePoint {
  coord: [number, number, number];
  label: string;
  /** A token color for its session, when sessions are told apart; the electrode color otherwise. */
  color?: string;
}

export type SceneHover =
  | { kind: "region"; id: number; x: number; y: number }
  | { kind: "electrode"; point: ElectrodePoint; x: number; y: number };

interface SceneEvents {
  onHover: (hover: SceneHover | null) => void;
  onPick: (id: number) => void;
}

interface RegionMesh {
  mesh: Mesh;
  material: MeshPhongMaterial;
  base: BaseLook & { themed: boolean };
  outline?: ShaderMaterial;
  mode: DisplayMode;
}

const DRAG_TOLERANCE = 3;
/** The width-to-height ratio the atlases' camera distances were tuned for. */
const WIDE_ASPECT = 1.2;

/** Token colors may carry alpha (#rrggbbaa); the scene draws the color and sets opacity itself. */
const toColor = (value: string) =>
  new Color(value.trim().slice(0, 7) || "#888888");

const OUTLINE_VERTEX = `
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vViewDir = normalize(-mvPosition.xyz);
    gl_Position = projectionMatrix * mvPosition;
  }`;

const OUTLINE_FRAGMENT = `
  uniform vec3 uColor;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    float rim = pow(1.0 - abs(dot(normalize(vNormal), vViewDir)), 2.5);
    gl_FragColor = vec4(uColor, rim * 0.9);
  }`;

/**
 * The 3D brain: region meshes, electrodes, picking and the camera. It knows nothing about panels or the URL;
 * React tells it what to show and hears back what is hovered or clicked.
 */
export class BrainScene {
  private readonly renderer: WebGLRenderer;
  private readonly scene = new Scene();
  private readonly world = new Group();
  private readonly camera = new PerspectiveCamera(45, 1, 1, 100000);
  private controls: OrbitControls;
  private readonly raycaster = new Raycaster();
  private readonly loader = new GLTFLoader();
  private readonly resize: ResizeObserver;
  private readonly meshes = new Map<number, RegionMesh>();
  private readonly pending = new Map<number, Promise<RegionMesh | null>>();
  private readonly failed = new Set<number>();
  private electrodes: Points<BufferGeometry, PointsMaterial> | null = null;
  private electrodeInfo: ElectrodePoint[] = [];
  private config: AtlasConfig | null = null;
  private data: AtlasData | null = null;
  private generation = 0;
  private center = new Vector3();
  private activeIds: ReadonlySet<number> = new Set();
  /** The opening view: Allen shows every region at its own opacity; the others show the solid brain. */
  private overview = true;
  /** The latest spotlight call, so a slow mesh from an earlier one can't undo a newer selection. */
  private spotlightRequest: symbol | null = null;
  private roiIds: ReadonlySet<number> = new Set();
  private regionOpacity = 1;
  private electrodeOpacity = 1;
  private hovered: number | null = null;
  private pointerDown: { x: number; y: number } | null = null;
  private colors: SceneColors = {
    background: "#ffffff",
    outline: "#888888",
    electrode: "#963232",
  };

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly events: SceneEvents,
  ) {
    this.renderer = new WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.scene.add(this.world);
    this.scene.add(new AmbientLight(0xffffff, 0.6));
    const key = new DirectionalLight(0xffffff, 0.8);
    key.position.set(10000, 10000, 10000);
    const fill = new DirectionalLight(0xffffff, 0.3);
    fill.position.set(-10000, -5000, -10000);
    this.scene.add(key, fill);
    this.controls = this.makeControls();

    canvas.addEventListener("pointermove", this.handleMove);
    canvas.addEventListener("pointerleave", this.handleLeave);
    canvas.addEventListener("pointerdown", this.handleDown);
    canvas.addEventListener("click", this.handleClick);
    // Keys arrive at the focusable stage around the canvas.
    (canvas.parentElement ?? canvas).addEventListener(
      "keydown",
      this.handleKey,
    );
    this.resize = new ResizeObserver(() => this.fit());
    this.resize.observe(canvas.parentElement ?? canvas);
    this.fit();
    this.renderer.setAnimationLoop(() => {
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
    });
  }

  dispose() {
    this.generation++;
    this.renderer.setAnimationLoop(null);
    this.resize.disconnect();
    this.canvas.removeEventListener("pointermove", this.handleMove);
    this.canvas.removeEventListener("pointerleave", this.handleLeave);
    this.canvas.removeEventListener("pointerdown", this.handleDown);
    this.canvas.removeEventListener("click", this.handleClick);
    (this.canvas.parentElement ?? this.canvas).removeEventListener(
      "keydown",
      this.handleKey,
    );
    this.clearMeshes();
    this.clearElectrodes();
    this.controls.dispose();
    this.renderer.dispose();
  }

  /** Replaces the atlas, loading the outline first and the regions in batches. Resolves false if superseded. */
  async setAtlas(
    config: AtlasConfig,
    data: AtlasData,
    onProgress: (loaded: number, total: number) => void,
  ) {
    const generation = ++this.generation;
    this.config = config;
    this.data = data;
    this.clearMeshes();
    this.clearElectrodes();
    this.events.onHover(null);
    this.activeIds = new Set([data.manifest.root_id]);
    this.roiIds = new Set();
    this.overview = true;
    this.raycaster.params.Points = { threshold: config.electrodePickThreshold };
    this.camera.near = config.nearPlane;
    this.camera.far = config.farPlane;
    this.camera.updateProjectionMatrix();

    const ids = initialMeshIds(data.manifest, config.coordSystem);
    onProgress(0, ids.length);
    await this.loadMesh(data.manifest.root_id);
    if (generation !== this.generation) return false;
    this.centerOnBrain();
    // The browser queues the requests over one HTTP/2 connection; each mesh reports as it lands.
    let loaded = 0;
    await Promise.all(
      ids.map((id) =>
        this.loadMesh(id).then(() => {
          if (generation === this.generation) onProgress(++loaded, ids.length);
        }),
      ),
    );
    return generation === this.generation;
  }

  /** The whole brain, as the atlas opens. */
  showWholeBrain() {
    this.spotlightRequest = null;
    this.overview = true;
    this.activeIds = new Set(this.data ? [this.data.manifest.root_id] : []);
    this.roiIds = new Set();
    this.refresh();
  }

  /** Shows the given regions as the focus, with optional extra regions as a soft overlay. */
  setSelection(
    activeIds: ReadonlySet<number>,
    roiIds: ReadonlySet<number> = new Set(),
  ) {
    this.overview = false;
    this.activeIds = activeIds;
    this.roiIds = roiIds;
    this.refresh();
  }

  private refresh() {
    for (const [id, entry] of this.meshes)
      this.applyMode(entry, this.modeFor(id));
  }

  /**
   * Spotlights regions: each one's own mesh, fetched if needed, else its nearest ancestor that has one.
   * Shows what is loaded at once, then again when missing meshes arrive, unless the selection moved on.
   */
  async spotlight(ids: readonly number[]) {
    const generation = this.generation;
    const request = (this.spotlightRequest = Symbol("spotlight"));
    const show = () => {
      const targets = ids
        .map((id) =>
          this.meshes.has(id) ? id : this.nearestAncestorWithMesh(id),
        )
        .filter((id): id is number => id !== null);
      this.setSelection(new Set(targets));
    };
    show();
    const missing = ids.filter(
      (id) =>
        !this.meshes.has(id) &&
        !this.failed.has(id) &&
        !this.data?.manifest.no_mesh?.includes(id),
    );
    if (missing.length === 0) return;
    await Promise.all(missing.map((id) => this.loadMesh(id)));
    if (generation === this.generation && request === this.spotlightRequest)
      show();
  }

  setRegionOpacity(opacity: number) {
    this.regionOpacity = opacity;
    this.refresh();
  }

  setElectrodeOpacity(opacity: number) {
    this.electrodeOpacity = opacity;
    if (this.electrodes) {
      this.electrodes.material.opacity = opacity;
      this.electrodes.visible = opacity > 0;
    }
  }

  setColors(colors: SceneColors) {
    this.colors = colors;
    this.renderer.setClearColor(toColor(colors.background), 1);
    for (const entry of this.meshes.values()) {
      if (!entry.base.themed) continue;
      entry.material.color = toColor(colors.outline);
      entry.outline?.uniforms.uColor.value.copy(toColor(colors.outline));
    }
    if (this.electrodes && !this.electrodes.material.vertexColors)
      this.electrodes.material.color = toColor(colors.electrode);
  }

  setView(view: ViewName) {
    if (!this.config) return;
    const { position, up } = cameraFor(
      view,
      this.config.coordSystem,
      this.center.toArray(),
      this.viewDistance(),
    );
    this.camera.position.set(...position);
    this.camera.up.set(...up);
    this.controls = this.makeControls(this.center);
  }

  /** Back to the lateral view the atlas opens with. */
  resetView() {
    this.centerOnBrain();
  }

  /** Turns the camera around the brain, keeping the atlas's up direction, as a drag does. */
  rotateBy(azimuth: number, polar: number) {
    const target = this.controls.target;
    const toYUp = new Quaternion().setFromUnitVectors(
      this.camera.up,
      new Vector3(0, 1, 0),
    );
    const offset = this.camera.position
      .clone()
      .sub(target)
      .applyQuaternion(toYUp);
    const spherical = new Spherical().setFromVector3(offset);
    spherical.theta += azimuth;
    spherical.phi = Math.min(
      Math.PI - 0.01,
      Math.max(0.01, spherical.phi + polar),
    );
    offset.setFromSpherical(spherical).applyQuaternion(toYUp.invert());
    this.camera.position.copy(target).add(offset);
    this.camera.lookAt(target);
    this.controls.update();
  }

  /** Slides the view sideways or up and down by a share of the distance to the brain. */
  panBy(right: number, up: number) {
    const distance = this.camera.position.distanceTo(this.controls.target);
    const sideways = new Vector3()
      .setFromMatrixColumn(this.camera.matrix, 0)
      .multiplyScalar(right * distance);
    const upward = new Vector3()
      .setFromMatrixColumn(this.camera.matrix, 1)
      .multiplyScalar(up * distance);
    const move = sideways.add(upward);
    this.camera.position.add(move);
    this.controls.target.add(move);
    this.controls.update();
  }

  /** Moves the camera toward the brain (below 1) or away (above 1). */
  zoomBy(factor: number) {
    const target = this.controls.target;
    const offset = this.camera.position
      .clone()
      .sub(target)
      .multiplyScalar(factor);
    this.camera.position.copy(target).add(offset);
    this.controls.update();
  }

  showElectrodes(points: ElectrodePoint[]) {
    this.clearElectrodes();
    if (!this.config || points.length === 0) return;
    const positions = new Float32Array(points.flatMap((point) => point.coord));
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
    const colored = points.some((point) => point.color);
    if (colored) {
      const colors = points.flatMap((point) =>
        toColor(point.color ?? this.colors.electrode).toArray(),
      );
      geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
    }
    const material = new PointsMaterial({
      color: colored ? 0xffffff : toColor(this.colors.electrode),
      vertexColors: colored,
      size: this.config.electrodeSize,
      sizeAttenuation: true,
      transparent: true,
      opacity: this.electrodeOpacity,
    });
    this.electrodes = new Points(geometry, material);
    // Drawn after the meshes, so they show through translucent regions; opaque ones still hide them.
    this.electrodes.renderOrder = 1;
    material.depthWrite = false;
    this.electrodeInfo = points;
    this.world.add(this.electrodes);
  }

  clearElectrodes() {
    if (!this.electrodes) return;
    this.world.remove(this.electrodes);
    this.electrodes.geometry.dispose();
    this.electrodes.material.dispose();
    this.electrodes = null;
    this.electrodeInfo = [];
  }

  private makeControls(target?: Vector3) {
    this.controls?.dispose();
    const controls = new OrbitControls(this.camera, this.canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.rotateSpeed = 0.8;
    controls.zoomSpeed = 1.2;
    if (target) {
      controls.target.copy(target);
      controls.update();
    }
    return controls;
  }

  private fit() {
    const box = this.canvas.parentElement ?? this.canvas;
    const width = box.clientWidth || 1;
    const height = box.clientHeight || 1;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  /**
   * The atlas's camera distance, tuned for a wide view, moved back on tall ones such as phones: the field of
   * view is vertical, so a narrow canvas sees less from side to side.
   */
  private viewDistance() {
    const distance = this.config?.camDist ?? 0;
    return distance * Math.max(1, WIDE_ASPECT / this.camera.aspect);
  }

  private centerOnBrain() {
    const root = this.data && this.meshes.get(this.data.manifest.root_id);
    if (!root || !this.config) return;
    this.center = new Box3().setFromObject(root.mesh).getCenter(new Vector3());
    const [dx, dy, dz] = this.config.camOffset;
    const d = this.viewDistance();
    this.camera.position.set(
      this.center.x + dx * d,
      this.center.y + dy * d,
      this.center.z + dz * d,
    );
    this.camera.up.set(...this.config.cameraUp);
    this.controls = this.makeControls(this.center);
  }

  private modeFor(id: number): DisplayMode {
    if (!this.data || !this.config) return "hidden";
    if (this.overview && this.config.coordSystem === "allen") return "glass";
    return decideDisplayMode(id, {
      rootId: this.data.manifest.root_id,
      coordSystem: this.config.coordSystem,
      activeIds: this.activeIds,
      roiIds: this.roiIds,
    });
  }

  private applyMode(entry: RegionMesh, mode: DisplayMode) {
    entry.mode = mode;
    if (mode === "silhouette") {
      entry.outline ??= new ShaderMaterial({
        uniforms: { uColor: { value: toColor(this.colors.outline) } },
        vertexShader: OUTLINE_VERTEX,
        fragmentShader: OUTLINE_FRAGMENT,
        transparent: true,
        depthWrite: false,
        side: FrontSide,
      });
      entry.mesh.material = entry.outline;
      entry.mesh.renderOrder = -1;
      entry.mesh.visible = true;
      return;
    }
    const look = modeLook(mode, entry.base, this.regionOpacity);
    const material = entry.material;
    material.opacity = look.opacity;
    material.transparent = look.transparent;
    material.depthWrite = look.depthWrite;
    material.needsUpdate = true;
    entry.mesh.material = material;
    entry.mesh.renderOrder = 0;
    entry.mesh.visible = look.visible;
  }

  private loadMesh(id: number): Promise<RegionMesh | null> {
    const existing = this.meshes.get(id);
    if (existing) return Promise.resolve(existing);
    const inFlight = this.pending.get(id);
    if (inFlight) return inFlight;
    const generation = this.generation;
    const config = this.config;
    const data = this.data;
    if (!config || !data) return Promise.resolve(null);
    const url = dataUrl(
      `atlases/${config.key}/meshes/${id}.glb?v=${MESH_VERSION}`,
    );
    const promise = this.loader
      .loadAsync(url)
      .then((gltf) => {
        if (generation !== this.generation) return null;
        let mesh: Mesh | null = null;
        gltf.scene.traverse((child) => {
          if (!mesh && child instanceof Mesh) mesh = child;
        });
        if (!mesh) return null;
        const found: Mesh = mesh;
        const isRoot = id === data.manifest.root_id;
        const base = baseLook({
          isRoot,
          // The outline never counts as a data region, even if a stale file lists it.
          region: isRoot ? undefined : data.regions.get(id),
          structure: data.structures.get(id),
          coordSystem: config.coordSystem,
          rootOpacity: config.rootOpacity,
        });
        const material = new MeshPhongMaterial({
          color: base.themed ? toColor(this.colors.outline) : base.color,
          transparent: true,
          opacity: base.opacity,
          wireframe: base.wireframe,
          side: base.doubleSided ? DoubleSide : FrontSide,
          depthWrite: base.depthWrite,
        });
        found.material = material;
        const entry: RegionMesh = {
          mesh: found,
          material,
          base,
          mode: "hidden",
        };
        this.world.add(found);
        this.meshes.set(id, entry);
        // A mesh that arrives mid-selection takes the current view's mode instead of flashing in.
        this.applyMode(entry, this.modeFor(id));
        return entry;
      })
      .catch(() => {
        if (generation === this.generation) this.failed.add(id);
        return null;
      })
      .finally(() => this.pending.delete(id));
    this.pending.set(id, promise);
    return promise;
  }

  private nearestAncestorWithMesh(id: number) {
    let current = this.data?.structures.get(id)?.parent_structure_id ?? null;
    while (current !== null) {
      if (this.meshes.has(current)) return current;
      current = this.data?.structures.get(current)?.parent_structure_id ?? null;
    }
    return null;
  }

  private clearMeshes() {
    for (const entry of this.meshes.values()) {
      this.world.remove(entry.mesh);
      entry.mesh.geometry.dispose();
      entry.material.dispose();
      entry.outline?.dispose();
    }
    this.meshes.clear();
    this.pending.clear();
    this.failed.clear();
    this.hovered = null;
  }

  private ray(event: PointerEvent | MouseEvent) {
    const rect = this.canvas.getBoundingClientRect();
    const pointer = new Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1,
    );
    this.raycaster.setFromCamera(pointer, this.camera);
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  /** The region under the pointer: the outline only when nothing else is hit, and never while it is a rim. */
  private regionHit(includeRoot: boolean) {
    const rootId = this.data?.manifest.root_id;
    const ids = new Map<Object3D, number>();
    for (const [id, entry] of this.meshes) {
      const pickable =
        entry.mesh.visible &&
        (id !== rootId || (includeRoot && entry.mode !== "silhouette"));
      if (pickable) ids.set(entry.mesh, id);
    }
    const hits = this.raycaster
      .intersectObjects([...ids.keys()], false)
      .map((hit) => ids.get(hit.object));
    return hits.find((id) => id !== rootId) ?? hits[0] ?? null;
  }

  private setHighlight(id: number | null) {
    if (this.hovered === id) return;
    const previous =
      this.hovered === null ? undefined : this.meshes.get(this.hovered);
    previous?.material.emissive.set(0x000000);
    this.hovered = id;
    const next = id === null ? undefined : this.meshes.get(id);
    // Brighten the region in its own color, so hover reads in either theme.
    next?.material.emissive.copy(next.material.color).multiplyScalar(0.35);
  }

  private readonly handleMove = (event: PointerEvent) => {
    const at = this.ray(event);
    if (this.electrodes?.visible) {
      const hit = this.raycaster.intersectObject(this.electrodes, false)[0];
      const point =
        hit?.index === undefined ? undefined : this.electrodeInfo[hit.index];
      if (point) {
        this.setHighlight(null);
        this.canvas.dataset.cursor = "electrode";
        this.events.onHover({ kind: "electrode", point, ...at });
        return;
      }
    }
    const id = this.regionHit(true);
    this.setHighlight(id);
    this.canvas.dataset.cursor = id === null ? "" : "region";
    this.events.onHover(id === null ? null : { kind: "region", id, ...at });
  };

  /**
   * Keys, once the 3D view has focus: arrows turn the brain 15°, Shift and arrows pan, + and − zoom,
   * Home resets, and 1 to 6 pick the views in the View menu's order.
   */
  private readonly handleKey = (event: KeyboardEvent) => {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    const turn = Math.PI / 12;
    const pan = event.shiftKey;
    const view = VIEWS[Number(event.key) - 1]?.value;
    const actions: Record<string, () => void> = {
      ArrowLeft: () => (pan ? this.panBy(-0.05, 0) : this.rotateBy(-turn, 0)),
      ArrowRight: () => (pan ? this.panBy(0.05, 0) : this.rotateBy(turn, 0)),
      ArrowUp: () => (pan ? this.panBy(0, 0.05) : this.rotateBy(0, -turn)),
      ArrowDown: () => (pan ? this.panBy(0, -0.05) : this.rotateBy(0, turn)),
      "+": () => this.zoomBy(0.85),
      "=": () => this.zoomBy(0.85),
      "-": () => this.zoomBy(1 / 0.85),
      Home: () => this.resetView(),
    };
    const action =
      actions[event.key] ?? (view ? () => this.setView(view) : undefined);
    if (!action) return;
    event.preventDefault();
    action();
  };

  private readonly handleLeave = () => {
    this.setHighlight(null);
    this.events.onHover(null);
  };

  private readonly handleDown = (event: PointerEvent) => {
    this.pointerDown = { x: event.clientX, y: event.clientY };
  };

  private readonly handleClick = (event: MouseEvent) => {
    if (this.pointerDown) {
      const dx = event.clientX - this.pointerDown.x;
      const dy = event.clientY - this.pointerDown.y;
      if (dx * dx + dy * dy > DRAG_TOLERANCE ** 2) return;
    }
    this.ray(event);
    // Clicking the outline does nothing: it is a large target that drags would hit by accident.
    const id = this.regionHit(false);
    if (id !== null) this.events.onPick(id);
  };
}
