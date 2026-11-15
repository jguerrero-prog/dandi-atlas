import { useState } from "react";

const read = (key: string, fallback: number) => {
  try {
    const value = Number(localStorage.getItem(key));
    return Number.isFinite(value) && value > 0 ? value : fallback;
  } catch {
    return fallback;
  }
};

/** A number kept in this browser, such as a panel's width; storage that fails only loses the memory. */
export function useStoredNumber(key: string, fallback: number) {
  const [value, setValue] = useState(() => read(key, fallback));
  const update = (next: number) => {
    setValue(next);
    try {
      localStorage.setItem(key, String(next));
    } catch {
      // Private windows and blocked storage: the panel still resizes, it just won't remember.
    }
  };
  return [value, update] as const;
}
