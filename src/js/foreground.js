import * as d3 from "d3";
import * as labels from "./labels";
import {
  LAYER_ZOOM_THRESHOLD_0,
  LAYER_ZOOM_THRESHOLD_1,
  LAYER_ZOOM_THRESHOLD_2,
  LAYER_ZOOM_RADIUS_0,
  LAYER_ZOOM_RADIUS_1,
  LAYER_ZOOM_RADIUS_2,
  LAYER_ZOOM_THRESHOLD_3,
  LAYER_ZOOM_RADIUS_3,
} from "./config";

function hideForegroundRects() {
  // set display none for all rects in the foreground
  selectForegroundSvg().selectAll("rect").style("opacity", "0.0");
}

export function initForeground(xScale, yScale, kZoom) {
  selectForegroundSvg()
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("viewBox", "0 0 100 100");

  const initialZoom = 1.0;
  updateForeground(xScale, yScale, initialZoom);

  labels.initLabels(xScale, yScale, kZoom);
  hideForegroundRects();
}

export function updateForeground(xScale, yScale, kZoom) {
  updateForegroundScaling(xScale, yScale);
  updateForegroundVisibility(kZoom);
  labels.updateLabels(xScale, yScale, kZoom);
}

export function selectForegroundSvg() {
  return d3.select("#chart").select("#foreground").select("svg");
}

function setForegroundLayerVisibility(layer, visibility) {
  layer.style.opacity = visibility;
}

function calcForegroundLayerVisibility(k, kStart, kStop, kRadius) {
  if (k <= kStart) {
    return 0.0;
  } else if (k <= kStart + kRadius) {
    return 1.0 - (kStart + kRadius - k) / kRadius;
  } else if (k <= kStop) {
    return 1.0;
  } else {
    return 0.0;
  }
}

function updateForegroundVisibility(kZoom) {
  const layers = getForegroundLayers();
  getForegroundVisibilities(kZoom).forEach((visibility, index) => {
    setForegroundLayerVisibility(layers[index], visibility);
  });
}

export function getForegroundVisibilities(kZoom) {
  if (kZoom == null || kZoom <= 0) {
    return;
  }

  const layerZoomThresholds = [
    LAYER_ZOOM_THRESHOLD_0,
    LAYER_ZOOM_THRESHOLD_1,
    LAYER_ZOOM_THRESHOLD_2,
    LAYER_ZOOM_THRESHOLD_3,
  ];
  const layerZoomRadiuses = [
    LAYER_ZOOM_RADIUS_0,
    LAYER_ZOOM_RADIUS_1,
    LAYER_ZOOM_RADIUS_2,
    LAYER_ZOOM_RADIUS_3,
  ];

  const layers = getForegroundLayers();

  const visibilities = [];

  layers.forEach((_layer, index) => {
    const layerMinZoom = layerZoomThresholds[index];
    const layerMaxZoom = Infinity;
    const radius = layerZoomRadiuses[index];
    const visibility = calcForegroundLayerVisibility(
      kZoom,
      layerMinZoom,
      layerMaxZoom,
      radius,
    );
    visibilities[index] = visibility;
  });

  return visibilities;
}

function sortForegroundLayers(layers) {
  const sorted = layers.sort((a, b) => a.id.localeCompare(b.id));
  return sorted;
}

export function getForegroundLayers() {
  const layers = selectForegroundSvg()
    .selectAll(":scope > g:not(#labels)")
    .filter(function () {
      // Filter out <g> elements where the display property is set to 'none'
      return d3.select(this).style("display") !== "none";
    })
    .nodes();
  return sortForegroundLayers(layers);
}

function updateForegroundScaling(xScale, yScale) {
  const width = xScale.domain()[1] - xScale.domain()[0];
  const height = yScale.domain()[1] - yScale.domain()[0];
  const x = xScale.domain()[0];
  const y = yScale.domain()[0];

  // we need to convert to the SVG coordinate system
  const y_prim = -y - height;

  selectForegroundSvg().attr("viewBox", `${x} ${y_prim} ${width} ${height}`);
}

const getViewBox = (svgElement) => {
  const viewBox = svgElement.viewBox.baseVal;

  return {
    minX: viewBox.x,
    minY: viewBox.y,
    width: viewBox.width,
    height: viewBox.height,
  };
};

/**
 * Converts foreground (map SVG) coordinates to their corresponding screen coordinates.
 * This function assumes that both the map SVG and the chart (D3 SVG) occupy the entire screen.
 * This is a temporary solution until data point rendering is re-implemented on the same SVG as the map.
 *
 * @param {number} x - The x-coordinate in the foreground's coordinate system.
 * @param {number} y - The y-coordinate in the foreground's coordinate system.
 * @return {{x: number, y: number}} - The corresponding screen coordinates.
 */
export function foregroundToScreenCoordinates(x, y) {
  const foregroundSvg = selectForegroundSvg().node();
  const { minX, minY, width, height } = getViewBox(foregroundSvg);
  const { clientWidth: svgWidth, clientHeight: svgHeight } = foregroundSvg;

  const screenX = ((x - minX) / width) * svgWidth;
  const screenY = ((y - minY) / height) * svgHeight;

  return { x: screenX, y: screenY };
}
