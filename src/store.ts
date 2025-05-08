import { create } from "zustand";
import { combine } from "zustand/middleware";
import { DataPoint } from "./schema";
import { fetchArticle } from "./js/article";

type Zoom = { x: number; y: number; scale: number };
type PartialDefaults = typeof partialDefaults;
type State = PartialDefaults & {
  currentZoom: Zoom | null;
  desiredZoom: Zoom | null;
};
type Size = {
  width: number;
  height: number;
};

const partialDefaults = {
  dataPoints: [] as DataPoint[],
  zoomStepFactor: 1.6,
  mapSize: {
    width: 0,
    height: 0,
  },
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
  maxDataPointsInViewport: 300,
};

const defaults: State = {
  ...partialDefaults,
  desiredZoom: null,
  currentZoom: null,
};

// TODO: break the main store into per-feature stores
export const useStore = create(
  combine(defaults, (set) => ({
    setDesiredZoom: (zoom: Zoom | null) => {
      set({ desiredZoom: zoom });
    },
    setCurrentZoom: (zoom: Zoom | null) => {
      set({ currentZoom: zoom });
    },
    setMapSize: (size: Size) => {
      set({ mapSize: size });
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
    setMaxDataPointsInViewport: (maxDataPointsInViewport: number) => {
      set({ maxDataPointsInViewport });
    },
    setDataPoints: (dataPoints: DataPoint[]) => {
      set({ dataPoints });
    },
  })),
);

const articleStoreDefaults: {
  article: string | null;
} = {
  article: null,
};

export const useArticleStore = create(
  combine(articleStoreDefaults, (set) => ({
    reset: () => {
      set({ article: null });
    },
    fetch: async (label: string) => {
      // TODO: Drop the legacy article.js dependency. Consider using SWR for fetching
      const articleHTML = await fetchArticle(label);
      set({ article: articleHTML });
    },
  })),
);
