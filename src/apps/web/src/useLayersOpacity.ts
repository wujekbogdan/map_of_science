export const LAYER_ZOOM_THRESHOLD_0 = -Infinity;
export const LAYER_ZOOM_THRESHOLD_1 = 0.8;
export const LAYER_ZOOM_THRESHOLD_2 = 3.2;
export const LAYER_ZOOM_THRESHOLD_3 = 9.6;

// TODO: These constants are redundant. I copied them from the original code.
// Probably the original intent was to be able to separate the zoom level from
// the opacity level. But in the end, they are the same. I'm leaving it as is for
// now.
// https://github.com/wujekbogdan/map-of-science/issues/62
export const LAYER_ZOOM_RADIUS_0 = LAYER_ZOOM_THRESHOLD_0;
export const LAYER_ZOOM_RADIUS_1 = LAYER_ZOOM_THRESHOLD_1;
export const LAYER_ZOOM_RADIUS_2 = LAYER_ZOOM_THRESHOLD_2;
export const LAYER_ZOOM_RADIUS_3 = LAYER_ZOOM_THRESHOLD_3;

const config = [
  { minZoom: LAYER_ZOOM_THRESHOLD_0, fadeDistance: LAYER_ZOOM_RADIUS_0 },
  { minZoom: LAYER_ZOOM_THRESHOLD_1, fadeDistance: LAYER_ZOOM_RADIUS_1 },
  { minZoom: LAYER_ZOOM_THRESHOLD_2, fadeDistance: LAYER_ZOOM_RADIUS_2 },
  { minZoom: LAYER_ZOOM_THRESHOLD_3, fadeDistance: LAYER_ZOOM_RADIUS_3 },
] as const;

const getVisibility = (zoom: number, min: number, fade: number): number => {
  if (!isFinite(fade)) return 1;
  if (zoom <= min) return 0;
  if (zoom >= min + fade) return 1;
  return (zoom - min) / fade;
};

export const useLayersOpacity = (zoom: number) => {
  const opacities = config.map(({ minZoom, fadeDistance }) =>
    getVisibility(zoom, minZoom, fadeDistance),
  );

  return {
    layer1: opacities[0],
    layer2: opacities[1],
    layer3: opacities[2],
    layer4: opacities[3],
  };
};
