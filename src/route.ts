import { useSyncExternalStore } from "react";
import { isAtlasKey, type AtlasKey } from "./atlas/configs";

/**
 * Where the app is, read from the address so every view can be linked and the back button works.
 * The query names the atlas; the hash holds the view, in the original viewer's format:
 * #region=672, #region=672,385 to compare, #dandiset=000017&subject=sub-M1&session=<asset id>.
 */
export interface Route {
  page: "atlas";
  atlas: AtlasKey;
  regions: number[];
  /** Compare mode: tree and brain clicks add regions instead of replacing the selection. */
  comparing: boolean;
  dandiset?: string;
  subject?: string;
  session?: string;
}

const DEFAULT_ATLAS: AtlasKey = "allen_ccf";

export function parseRoute(search: string, hash: string): Route {
  const query = new URLSearchParams(search);
  const view = new URLSearchParams(hash.replace(/^#/, ""));
  // A bare address opens the viewer on the Allen CCF; there is no separate landing page.
  const atlas = query.get("atlas");
  const regions = (view.get("region") ?? "")
    .split(",")
    .map((part) => Number(part))
    .filter((id) => Number.isInteger(id) && id > 0);
  return {
    page: "atlas",
    atlas: isAtlasKey(atlas) ? atlas : DEFAULT_ATLAS,
    regions: [...new Set(regions)],
    comparing: view.get("compare") === "1" || regions.length > 1,
    dandiset: view.get("dandiset") ?? undefined,
    subject: view.get("subject") ?? undefined,
    session: view.get("session") ?? undefined,
  };
}

/** The address for a route, relative to the app's base path. */
export function routeHref(
  route: Route,
  base = import.meta.env.BASE_URL,
): string {
  const view = new URLSearchParams();
  if (route.dandiset) view.set("dandiset", route.dandiset);
  if (route.regions.length > 0) view.set("region", route.regions.join(","));
  if (route.comparing && route.regions.length < 2) view.set("compare", "1");
  if (route.subject) view.set("subject", route.subject);
  if (route.session) view.set("session", route.session);
  // Commas stay readable, as the original viewer wrote them.
  const hash = view.toString().replace(/%2C/g, ",");
  return `${base}?atlas=${route.atlas}${hash ? `#${hash}` : ""}`;
}

const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  window.addEventListener("popstate", listener);
  window.addEventListener("hashchange", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("popstate", listener);
    window.removeEventListener("hashchange", listener);
  };
};

// One string, so the snapshot compares by value; the separator can't appear in a URL.
const SEPARATOR = "\u0000";
const snapshot = () =>
  `${window.location.search}${SEPARATOR}${window.location.hash}`;

/** The current route, kept in step with the address. */
export function useRoute(): Route {
  const [search, hash] = useSyncExternalStore(subscribe, snapshot).split(
    SEPARATOR,
  );
  return parseRoute(search, hash);
}

/** Goes to a route as a new history entry, or in place of the current one. */
export function navigate(route: Route, { replace = false } = {}) {
  const href = routeHref(route);
  if (
    href ===
    `${window.location.pathname}${window.location.search}${window.location.hash}`
  )
    return;
  window.history[replace ? "replaceState" : "pushState"](null, "", href);
  notify();
}

/** Follows an in-app link, such as a breadcrumb, as a new history entry. */
export function navigateHref(href: string) {
  window.history.pushState(null, "", href);
  notify();
}
