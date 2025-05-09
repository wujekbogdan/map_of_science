import { z } from "zod";
import { DataSchema, ConceptSchema, CityLabelSchema } from "./model";
import { loadAsMap } from "./utils.ts";

/**
 * - City labels loading doesn't depend on anything.
 * - Concepts loading doesn't depend on anything either.
 * - Data points depend only on city labels.
 *
 * To maximize parallelism, we can load city labels and concepts in parallel
 * and then wait for city labels to finish before loading data points.
 */
export const loadData = async () => {
  const loadingConcepts = loadAsMap({
    url: new URL("../../asset/keys.tsv", import.meta.url).href,
    schema: ConceptSchema(z),
    getKey: (item) => item.index,
  });

  const loadingLabels = loadAsMap({
    url: new URL("../../asset/labels.tsv", import.meta.url).href,
    schema: CityLabelSchema(z),
    getKey: (item) => item.clusterId,
  });

  // We're awaiting the labels promise only because at this point we don't care about concepts yet
  const rawLabels = await loadingLabels;

  const [concepts, dataPoints] = await Promise.all([
    loadingConcepts,
    loadAsMap({
      url: new URL("../../asset/data.tsv", import.meta.url).href,
      schema: DataSchema(z, rawLabels),
      getKey: (item) => item.clusterId,
    }),
  ]);

  // Populate labels with x,y coordinates
  const labels = [...rawLabels.values()]
    .map(({ clusterId, label }) => {
      const point = dataPoints.get(clusterId);
      return {
        x: point?.x ?? NaN,
        y: point?.y ?? NaN,
        clusterId,
        label,
      };
    })
    .filter(({ x, y }) => !Number.isNaN(x) && !Number.isNaN(y));

  const dataPointsOrdered = [...dataPoints.values()].sort(
    (a, b) => b.numRecentArticles - a.numRecentArticles,
  );

  return {
    concepts,
    labels,
    dataPoints: dataPointsOrdered,
  };
};
