import { z } from "zod";
import {
  DataSchema,
  ConceptSchema,
  CityLabelSchema,
  YoutubeVideoSchema,
  YoutubeVideo,
} from "./model";
import { loadAsArray, loadAsMap } from "./utils.ts";

// TODO: move this out from here. It does not belong to the API layer.
// It's more of a service layer.
// https://github.com/wujekbogdan/map-of-science/issues/57

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

  const loadingYoutubeData = loadAsArray({
    url: new URL("../../asset/youtube.tsv", import.meta.url).href,
    schema: YoutubeVideoSchema(z),
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

  // Populate labels with x,y coordinates coming from data points
  const cityLabels = [...rawLabels.values()]
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

  const dataPointsOrdered = new Map(
    [...dataPoints.entries()].sort(
      ([, a], [, b]) => b.numRecentArticles - a.numRecentArticles,
    ),
  );

  // TODO: Indexing videos by labelId isn't great. We need to give labels proper ids.
  const labelToVideos = new Map<string, YoutubeVideo[]>(
    Object.entries(
      (await loadingYoutubeData).reduce<Record<string, YoutubeVideo[]>>(
        (acc, video) => {
          return video.labelIds.reduce<Record<string, YoutubeVideo[]>>(
            (innerAcc, labelId) => ({
              ...innerAcc,
              [labelId]: [...(innerAcc[labelId] ?? []), video],
            }),
            acc,
          );
        },
        {},
      ),
    ),
  );

  return {
    concepts,
    cityLabels,
    dataPoints: dataPointsOrdered,
    youtube: labelToVideos,
  };
};
