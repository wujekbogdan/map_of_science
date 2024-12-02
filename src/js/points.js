import * as chart from "./chart";

export let data = [];
let concepts = {};
let cityLabels = [];
export let cityLabelsByClusterId = {};

function parseKeyConceptsRaw(keyConceptsRaw) {
  return keyConceptsRaw.split(",");
}

function parseConceptItem(item) {
  concepts[item["index"]] = item["key"];
}

function parseDataPointItem(item) {
  return {
    clusterId: Number(item["cluster_id"]),
    x: Number(item["x"]),
    y: Number(item["y"]),
    numRecentArticles: Number(item["num_recent_articles"]),
    growthRating: Number(item["growth_rating"]),
    clusterCategoryId: Number(item["cluster_category"]),
    keyConcepts: parseKeyConceptsRaw(item["key_concepts"]),
    cityLabel: cityLabelsByClusterId[Number(item["cluster_id"])] || null,
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
}

function buildLoaderWorker() {
  return new Worker(new URL("./streaming-tsv-parser.js", import.meta.url).href);
}

function handleLoaderWorkerMessage(
  // eslint-disable-next-line no-unused-vars
  { data: { items, totalBytes, finished } },
  parseItem,
  dataTarget,
  onLoaded,
) {
  const rows = items.map(parseItem);

  dataTarget.push(...rows);

  if (finished) {
    onLoaded(dataTarget);
  }
}

function runLoaderWorker(loaderWorker, url) {
  loaderWorker.postMessage(url.href);
}

function loadData(url, parseItem, dataTarget, onLoaded) {
  const loaderWorker = buildLoaderWorker();
  loaderWorker.onmessage = (d) =>
    handleLoaderWorkerMessage(d, parseItem, dataTarget, onLoaded);
  runLoaderWorker(loaderWorker, url);
}

function parseCityLabelItem(item) {
  cityLabelsByClusterId[Number(item["cluster_id"])] = item["label"];
}

function loadCityLabels() {
  loadData(
    new URL("../../asset/labels.tsv", import.meta.url),
    parseCityLabelItem,
    cityLabels, // Store city labels in the cityLabels array
    () => {},
  );
}

export function loadDataPoints() {
  loadData(
    new URL("../../asset/data.tsv", import.meta.url),
    parseDataPointItem,
    data, // Separate array for data points
    handleDataPointsLoaded,
  );
  loadCityLabels(); // Load city labels after loading data points
}

export function loadConcepts() {
  loadData(
    new URL("../../asset/keys.tsv", import.meta.url),
    parseConceptItem,
    [], // We don't need to store the concepts in an array, they go to the `concepts` object
    () => {},
  );
}
