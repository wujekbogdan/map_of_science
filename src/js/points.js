import * as chart from "./chart";
import { eventBus } from "../event-bus";
import { loadData } from "../api/worker.ts";

// TODO: Avoid globals and mutability - use store instead
export let data = [];
let conceptsData = new Map();

// TODO: move to React
export function buildDataPointDetails(dataPoint) {
  let html = "";

  if (dataPoint.cityLabel) {
    html += "<strong>" + dataPoint.cityLabel + "</strong>";
  } else {
    html += "<strong>#" + dataPoint.clusterId + "</strong>";
  }
  html += "<br />";

  if (dataPoint.numRecentArticles <= 100) {
    html += "<span class='few-articles'>";
  } else if (dataPoint.numRecentArticles >= 1000) {
    html += "<span class='many-articles'>";
  } else {
    html += "<span>";
  }
  html += "Liczba artykułów: " + dataPoint.numRecentArticles + "</span><br />";

  // growth rating
  if (dataPoint.growthRating >= 80) {
    html += "<span class='many-articles'>";
  } else {
    html += "<span>";
  }
  html += "Wskaźnik rozwoju: " + dataPoint.growthRating + "</span><br />";

  // key concepts

  html += "<br /><strong>Słowa kluczowe:</strong><ul>";

  for (const concept_id of dataPoint.keyConcepts) {
    html += "<li>" + conceptsData.get(Number(concept_id)).key + "</li>";
  }

  html += "</ul>";
  return html;
}

// TODO: Bring back WebWorker
export const load = async () => {
  const { concepts, labels, dataPoints } = await loadData();

  // TODO: Avoid globals and mutability - use store instead
  data = dataPoints;
  conceptsData = concepts;

  // TODO: Looping through dataPoints isn't efficient. We can likely avoid this by handling the sorting during the data loading process.
  dataPoints.sort((a, b) => b.numRecentArticles - a.numRecentArticles);
  chart.initChart(dataPoints);

  eventBus.emit(
    "cityLabelsLoaded",
    Object.values(labels).filter(({ x, y }) => !!(x && y)), // only include labels that belong to a data point
  );
};
