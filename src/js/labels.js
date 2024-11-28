import { eventBus } from "./../event-bus.ts";
import { getForegroundVisibilities } from "./foreground.js";

export function initLabels(xScale, yScale, kZoom) {
  updateLabels(xScale, yScale, kZoom);
}

export function updateLabels(xScale, yScale, kZoom) {
  const visibilities = getForegroundVisibilities(kZoom);
  eventBus.emit("labelsUpdate", {
    xScale,
    yScale,
    zoom: kZoom,
    visibility: visibilities,
  });
}
