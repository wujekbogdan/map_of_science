import * as d3 from "d3";
import * as chart from "./chart.js";
import * as annotation from "./annotation.js";
import * as foreground from "./foreground.js";

export const zoomMin = 0.5;
export const zoomMax = 50.0;

export const xScaleOriginal = d3.scaleLinear();
export const yScaleOriginal = d3.scaleLinear();

export let xScale = xScaleOriginal.copy();
export let yScale = yScaleOriginal.copy();
export let zoomTransform = d3.zoomIdentity;

export function transformLocalScaleDomains(transform) {
  // rescale to present the area which should be visible after zoom
  const xRange = transform.rescaleX(xScaleOriginal).domain();
  const yRange = transform.rescaleY(yScaleOriginal).domain();

  xScale.domain(xRange);
  yScale.domain(yRange);
}

export function updateGlobalScaleDomains(chartWidth, chartHeight) {
  // rescale the global domain to keep chart aspect ratio
  xScaleOriginal.domain([-chartWidth / 2, chartWidth / 2]);
  yScaleOriginal.domain([-chartHeight / 2, chartHeight / 2]);
}

export function handleZoom(event, data) {
  zoomTransform = event.transform;

  // update scales
  const width = document.getElementById("chart-d3").clientWidth;
  const height = document.getElementById("chart-d3").clientHeight;
  updateGlobalScaleDomains(width, height);
  transformLocalScaleDomains(zoomTransform);
  updateScaleRanges(width, height);

  // update points
  const _data = getDataPointsToRender(data, xScale, yScale);
  chart.renderChart(_data);

  // update annotation
  annotation.updateAnnotation(null, xScale, yScale);

  // update foreground
  foreground.updateForeground(xScale, yScale, zoomTransform.k);
}

export function updateScaleRanges(chartWidth, chartHeight) {
  const xRange = [0, chartWidth];
  const yRange = [chartHeight, 0];
  xScaleOriginal.range(xRange);
  yScaleOriginal.range(yRange);
  xScale.range(xRange);
  yScale.range(yRange);
}

function isDataPointInDomain(dataPoint, xScale, yScale) {
  const x = dataPoint.x;
  const y = dataPoint.y;

  const xDomain = xScale.domain();
  const yDomain = yScale.domain();

  if (x < xDomain[0] || x > xDomain[1] || y < yDomain[0] || y > yDomain[1]) {
    return false;
  }

  return true;
}

function getDataPointsToRender(dataPointsSorted, xScale, yScale) {
  const dataInDomain = dataPointsSorted.filter((d) =>
    isDataPointInDomain(d, xScale, yScale),
  );
  const dataToRender = dataInDomain.slice(0, 300);
  return dataToRender;
}

export function handleResize(data) {
  // update scales
  const width = document.getElementById("chart-d3").clientWidth;
  const height = document.getElementById("chart-d3").clientHeight;
  updateGlobalScaleDomains(width, height);
  transformLocalScaleDomains(zoomTransform);
  updateScaleRanges(width, height);

  const _data = getDataPointsToRender(data, xScale, yScale);
  chart.renderChart(_data);

  // update annotation
  annotation.updateAnnotation(null, xScale, yScale);

  // update foreground
  foreground.updateForeground(xScale, yScale, zoomTransform.k);
}
