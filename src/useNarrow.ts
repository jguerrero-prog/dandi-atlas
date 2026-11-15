import { useSyncExternalStore } from "react";

/** The same breakpoint as Neurosift's app bar, where actions collapse to icons. */
const NARROW = "(width <= 768px)";

/** True on phones and narrow windows, where the workspace shows one panel at a time. */
export function useNarrow() {
  return useSyncExternalStore(
    (notify) => {
      const query = window.matchMedia(NARROW);
      query.addEventListener("change", notify);
      return () => query.removeEventListener("change", notify);
    },
    () => window.matchMedia(NARROW).matches,
    () => false,
  );
}
