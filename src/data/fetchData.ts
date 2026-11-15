/** Where the pipeline's files are served: data/ beside the app, under Vite's base path. */
export const dataUrl = (path: string) => `${import.meta.env.BASE_URL}data/${path}`;

/** Reads one of the pipeline's JSON files, checks its shape and names the file if either step fails. */
export async function fetchData<T>(
  path: string,
  isValid: (data: unknown) => data is T,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(dataUrl(path), init);
  if (!response.ok) throw new Error(`Couldn't load ${path} (${response.status})`);
  const data: unknown = await response.json();
  if (!isValid(data)) throw new Error(`${path} isn't in the expected format`);
  return data;
}

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export interface LastUpdated {
  timestamp: string;
}

const isLastUpdated = (data: unknown): data is LastUpdated =>
  isRecord(data) && typeof data.timestamp === "string";

/** The time of the last nightly run, read fresh each visit so a new run shows straight away. */
export const fetchLastUpdated = () =>
  fetchData("last_updated.json", isLastUpdated, { cache: "no-cache" });
