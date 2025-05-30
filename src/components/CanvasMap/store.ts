import { create } from "zustand";
import { combine } from "zustand/middleware";

export type Threshold = {
  min: number;
  size: number;
  visible: boolean;
};

type Size = {
  width: number;
  height: number;
};

const defaults = {
  thresholds: [
    { min: 0, size: 1, visible: true },
    { min: 51, size: 2, visible: true },
    { min: 201, size: 3, visible: true },
    { min: 501, size: 5, visible: true },
    { min: 1001, size: 5, visible: true },
    { min: 2001, size: 6, visible: true },
  ],
  size: { width: 1000, height: 1000 },
  blur: 0,
  oneBitThreshold: 128,
  oneBitMode: false,
};

export const useConfigStore = create(
  combine(defaults, (set) => ({
    setThresholds: (thresholds: Threshold[]) => set({ thresholds }),
    setSize: (size: Size) => set({ size }),
    setBlur: (blur: number) => set({ blur }),
    setOneBitThreshold: (oneBitThreshold: number) => set({ oneBitThreshold }),
    setOneBitMode: (oneBitMode: boolean) => set({ oneBitMode }),
  })),
);
