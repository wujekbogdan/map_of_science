import { create } from "zustand";
import { combine } from "zustand/middleware";
import { DataPoint } from "./schema";

type Zoom = { x: number; y: number; scale: number };
type PartialDefaults = typeof partialDefaults;
type State = PartialDefaults & {
  currentZoom: Zoom | null;
  desiredZoom: Zoom | null;
};

const partialDefaults = {
  dataPoints: [] as DataPoint[],
  zoomStepFactor: 1.6,
  fontSize: {
    layer1: 16,
    layer2: 12.8,
    layer3: 6.4,
    layer4: 3,
  },
  scaleFactor: {
    min: 0.5,
    max: 16,
    zoom: 0.5,
  },
};

const defaults: State = {
  ...partialDefaults,
  desiredZoom: null,
  currentZoom: null,
};

export const useStore = create(
  combine(defaults, (set) => ({
    setDesiredZoom: (zoom: Zoom | null) => {
      set({ desiredZoom: zoom });
    },
    setCurrentZoom: (zoom: Zoom | null) => {
      set({ currentZoom: zoom });
    },
    setZoomStepFactor: (zoomStepFactor: number) => {
      set({ zoomStepFactor });
    },
    setFontSize: (
      layer: keyof typeof defaults.fontSize,
      size: number | string,
    ) => {
      const parsedSize = typeof size === "string" ? parseFloat(size) : size;
      set((state) => ({
        fontSize: {
          ...state.fontSize,
          [layer]: parsedSize || defaults.fontSize[layer],
        },
      }));
    },
    setScaleFactor: (
      factor: keyof typeof defaults.scaleFactor,
      value: number | string,
    ) => {
      const parsedValue = typeof value === "string" ? parseFloat(value) : value;
      set((state) => ({
        scaleFactor: {
          ...state.scaleFactor,
          [factor]: parsedValue || defaults.scaleFactor[factor],
        },
      }));
    },
    setDataPoints: (dataPoints: DataPoint[]) => {
      set({ dataPoints });
    },
  })),
);
