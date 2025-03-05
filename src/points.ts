import { arrayCollector, parseFromUrlWithSchema } from "./csv/parse";
import { DataSchema, ConceptSchema, CityLabelSchema } from "./schema";
import { mapCollector } from "./csv/parse";

/**
 * - City labels loading doesn't depend on anything.
 * - Concepts loading doesn't depend on anything either.
 * - Data points depend only on city labels.
 *
 * To maximize parallelism, we can load city labels and concepts in parallel
 * and then wait for city labels to finish before loading data points.
 */
export const loadData = async () => {
  const loadingConcepts = parseFromUrlWithSchema({
    url: new URL("../asset/keys.tsv", import.meta.url).href,
    defineSchema: ConceptSchema,
    Collector: mapCollector({ indexBy: "key" }),
  });

  const loadingLabels = parseFromUrlWithSchema({
    url: new URL("../asset/labels.tsv", import.meta.url).href,
    defineSchema: CityLabelSchema,
    Collector: mapCollector({ indexBy: "clusterId" }),
  });

  // We're awaiting the labels promise only because at this point we don't care about concepts yet
  const labels = await loadingLabels;

  const [concepts, dataPoints] = await Promise.all([
    loadingConcepts,
    parseFromUrlWithSchema({
      url: new URL("../asset/data.tsv", import.meta.url).href,
      defineSchema: (z) =>
        DataSchema(
          z,
          // TODO: Fix setCollector typing so that this type assertion is not needed
          labels as Map<number, { clusterId: number; label: string }>,
        ),
      Collector: arrayCollector,
    }),
  ]);

  return { concepts, labels, dataPoints };
};
