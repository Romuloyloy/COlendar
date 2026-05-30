export const PALETTE_STORAGE_KEY = "calendar:palette";
export const PALETTE_CHANGED_EVENT = "palette:changed";

export const palettes = [
  { value: "robot-vanilla", label: "Robot Vanilla" },
  { value: "duckberry", label: "DuckBerry" },
  { value: "bozzywheat", label: "BozzyWheat" },
] as const;

export type PaletteValue = (typeof palettes)[number]["value"];

export function isPaletteValue(value: string | null): value is PaletteValue {
  return palettes.some((palette) => palette.value === value);
}

export function savedPalette(): PaletteValue {
  const value = window.localStorage.getItem(PALETTE_STORAGE_KEY);
  return isPaletteValue(value) ? value : "robot-vanilla";
}

export function applyPalette(palette: PaletteValue) {
  window.localStorage.setItem(PALETTE_STORAGE_KEY, palette);
  document.documentElement.dataset.palette = palette;
  window.dispatchEvent(new CustomEvent<PaletteValue>(PALETTE_CHANGED_EVENT, {
    detail: palette,
  }));
}
