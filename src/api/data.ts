import { z, ZodSchema, ZodTypeDef } from "zod";
import { arrayCollector, mapCollector } from "../csv/collector.ts";
import { createProcessor, withHttpProvider } from "../csv/parse.ts";
import { DataSchema, ConceptSchema, CityLabelSchema } from "./model";

type Options<T> = {
  url: string;
  schema: ZodSchema<T, ZodTypeDef, unknown>;
};

const loadAsArray = async <T>({ url, schema }: Options<T>) => {
  const collector = arrayCollector<T>();
  const processor = createProcessor(schema, collector);

  await withHttpProvider(url, processor.process);

  return processor.getResults();
};

const loadAsMap = async <T, K>({
  url,
  schema,
  getKey,
}: Options<T> & { getKey: (item: T) => K }) => {
  const collector = mapCollector<K, T>(getKey);
  const processor = createProcessor(schema, collector);

  await withHttpProvider(url, processor.process);

  return processor.getResults();
};

/**
 * - City labels loading doesn't depend on anything.
 * - Concepts loading doesn't depend on anything either.
 * - Data points depend only on city labels.
 *
 * To maximize parallelism, we can load city labels and concepts in parallel
 * and then wait for city labels to finish before loading data points.
 */
export const loadData = async () => {
  const [concepts, dataPoints, labels] = await Promise.all([
    loadAsMap({
      url: new URL("../../asset/keys.tsv", import.meta.url).href,
      schema: ConceptSchema(z),
      getKey: (item) => item.index,
    }),
    loadAsMap({
      url: new URL("../../asset/data.tsv", import.meta.url).href,
      schema: DataSchema(z),
      getKey: (item) => item.clusterId,
    }),
    loadAsArray({
      url: new URL("../../asset/labels.tsv", import.meta.url).href,
      schema: CityLabelSchema(z),
    }),
  ]);

  const labelsFiltered = labels
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
    labels: labelsFiltered,
    dataPoints: dataPointsOrdered,
  };
};
