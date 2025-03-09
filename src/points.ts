import { createProcessor, withHttpProvider } from "./csv/parse";
import { DataSchema, ConceptSchema, CityLabelSchema } from "./schema";
import { z, ZodSchema, ZodTypeDef } from "zod";
import { arrayCollector, mapCollector } from "./csv/collector.ts";

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
  const loadingConcepts = loadAsMap({
    url: new URL("../asset/keys.tsv", import.meta.url).href,
    schema: ConceptSchema(z),
    getKey: (item) => item.key,
  });

  const loadingLabels = loadAsMap({
    url: new URL("../asset/labels.tsv", import.meta.url).href,
    schema: CityLabelSchema(z),
    getKey: (item) => item.clusterId,
  });

  // We're awaiting the labels promise only because at this point we don't care about concepts yet
  const labels = await loadingLabels;

  const [concepts, dataPoints] = await Promise.all([
    loadingConcepts,
    loadAsArray({
      url: new URL("../asset/data.tsv", import.meta.url).href,
      schema: DataSchema(z, labels),
    }),
  ]);

  return { concepts, labels, dataPoints };
};
