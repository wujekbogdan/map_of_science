import * as chart from "./chart";
import { eventBus } from "../event-bus";
import { parseFromUrl } from "../csv/parse";

export let data = [];
let concepts = {};

/**
 * @type {Record<number, { clusterId: number, label: string, x: number, y: number }>}
 */
const cityLabels = {};

function parseKeyConceptsRaw(keyConceptsRaw) {
  return keyConceptsRaw.split(",");
}

function parseConceptItem(item) {
  concepts[item["index"]] = item["key"];
}

function parseDataPointItem(item) {
  const clusterId = Number(item["cluster_id"]);
  const hasCityLabel = !!cityLabels[clusterId];
  const x = Number(item["x"]);
  const y = Number(item["y"]);

  // Populate cityLabels with missing x and y coordinates to make it possible to display them on the map
  if (hasCityLabel) {
    cityLabels[clusterId] = {
      ...cityLabels[clusterId],
      x,
      y,
    };
  }

  return {
    clusterId: clusterId,
    x,
    y,
    numRecentArticles: Number(item["num_recent_articles"]),
    growthRating: Number(item["growth_rating"]),
    clusterCategoryId: Number(item["cluster_category"]),
    keyConcepts: parseKeyConceptsRaw(item["key_concepts"]),
    cityLabel: hasCityLabel ? cityLabels[clusterId].label : null,
  };
}

// eslint-disable-next-line no-unused-vars
function findClosestDataPoint(dataPoints, x, y, radius) {
  dataPoints.sort((a, b) => {
    const distA = Math.pow(a.x - x, 2) + Math.pow(a.y - y, 2);
    const distB = Math.pow(b.x - x, 2) + Math.pow(b.y - y, 2);
    return distA - distB;
  });
  const closestDataPoint = dataPoints[0];
  const dist =
    Math.pow(closestDataPoint.x - x, 2) + Math.pow(closestDataPoint.y - y, 2);

  if (dist > radius * radius) {
    return null;
  }
  return closestDataPoint;
}

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
    html += "<li>" + concepts[Number(concept_id)] + "</li>";
  }

  html += "</ul>";
  return html;
}

function handleDataPointsLoaded(dataPoints) {
  // Sort data by num_recent_articles
  dataPoints.sort((a, b) => b.numRecentArticles - a.numRecentArticles);
  chart.initChart(dataPoints);

  // Feels confusing and actually is confusing, but only at this point labels are fully loaded since label x and y
  // coordinates are only available after data points are loaded
  eventBus.emit(
    "cityLabelsLoaded",
    Object.values(cityLabels).filter(({ x, y }) => !!(x && y)), // only include labels that belong to a data point
  );
}

function loadData(url, parseItem, dataTarget, onLoaded) {
  parseFromUrl(url, parseItem).then((parsedData) => {
    dataTarget = Array.from(parsedData);
    onLoaded(dataTarget);
  });
}

function loadCityLabels() {
  return new Promise((resolve) => {
    loadData(
      new URL("../../asset/labels.tsv", import.meta.url),
      (label) => {
        const clusterId = Number(label["cluster_id"]);
        const labelValue = label["label"];
        cityLabels[clusterId] = {
          clusterId,
          label: labelValue,
        };
      },
      [],
      () => {
        resolve();
      },
    );
  });
}

export async function loadDataPoints() {
  await loadCityLabels();
  loadData(
    new URL("../../asset/data.tsv", import.meta.url),
    parseDataPointItem,
    data, // Separate array for data points
    handleDataPointsLoaded,
  );
}

export function loadConcepts() {
  loadData(
    new URL("../../asset/keys.tsv", import.meta.url),
    parseConceptItem,
    [], // We don't need to store the concepts in an array, they go to the `concepts` object
    () => {},
  );
}
