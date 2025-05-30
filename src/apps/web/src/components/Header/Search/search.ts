import { normalizeSync } from "normalize-diacritics";
import { MapSvgRepresentation } from "../../../../vite-plugin/svg-map-parser.ts";
import { Concept, DataPoint } from "../../../api/model";

export type LabelModel = {
  id: string;
  label: string;
  normalizedLabel: string;
  boundingBox: {
    min: { x: number; y: number };
    max: { x: number; y: number };
    center: { x: number; y: number };
  };
};

type ConceptWithClustersModel = {
  id: number;
  name: string;
  nameNormalized: string;
  clusters: {
    clusterId: number;
    x: number;
    y: number;
  }[];
  articlesCount: number;
};
type ConceptId = number;

// FIXME: This isn't exactly right. The code assumes that the model never changes.
// It's true in practice, but in theory one could call the search function with
// a different map parameter each time.
let cachedLabelsCollection: LabelModel[] | null = null;
let cachedClustersByConcept: Map<ConceptId, ConceptWithClustersModel> | null =
  null;

/**
 * Normalize a string by removing diacritics and converting to lowercase.
 */
const normalize = (str: string) =>
  normalizeSync(str.replace("#", "").toLowerCase());

const mapPath = (
  path: MapSvgRepresentation["layer1"]["children"][number]["path"],
) => ({
  id: path.id,
  label: path.label.replace("#", ""),
  normalizedLabel: normalize(path.label),
  boundingBox: path.boundingBox,
});

export const createLabelsCollection = (map: MapSvgRepresentation) => [
  ...map.layer1.children.map(({ path }) => mapPath(path)),
  ...map.layer2.children.map(({ path }) => mapPath(path)),
  ...map.layer3.groups.flatMap((group) =>
    group.children.map(({ rect }) => ({
      id: rect.id,
      label: rect.label.replace("#", ""),
      normalizedLabel: normalize(rect.label),
      boundingBox: rect.boundingBox,
    })),
  ),
];

export const createClustersByConcept = (
  dataPoints: Map<number, DataPoint>,
  concepts: Map<number, Concept>,
) => {
  const result = new Map<number, ConceptWithClustersModel>();

  // DO NOT rewrite this in an immutable way. Using reduce immutably would require constructing
  // a new object for each conceptId, which has a *massive* performance cost - orders of magnitude slower.
  [...dataPoints.values()].forEach(
    ({ keyConcepts, clusterId, x, y, numRecentArticles }) => {
      keyConcepts.forEach((conceptId) => {
        if (!result.has(conceptId)) {
          const name = concepts.get(conceptId)?.key ?? "UNKNOWN";
          result.set(conceptId, {
            id: conceptId,
            articlesCount: numRecentArticles,
            name,
            // TODO: normalizeSync seems to be very slow. Let's use toLowerCase
            // for now, but look for a better solution later.
            nameNormalized: name.toLowerCase(),
            clusters: [],
          });
        }
        result.get(conceptId)?.clusters.push({
          clusterId,
          x,
          y,
        });
      });
    },
  );

  return result;
};

type Options = {
  map: MapSvgRepresentation;
  dataPoints: Map<number, DataPoint>;
  concepts: Map<number, Concept>;
};

export const search = (options: Options, phrase: string) => {
  const labelsCollection =
    cachedLabelsCollection ??
    (cachedLabelsCollection = createLabelsCollection(options.map));
  const clustersByConcept =
    cachedClustersByConcept ??
    (cachedClustersByConcept = createClustersByConcept(
      options.dataPoints,
      options.concepts,
    ));

  if (!phrase)
    return {
      labels: [],
      points: [],
    };

  const normalizedPhrase = normalize(phrase).toLowerCase();

  const points = () => {
    const results = [...clustersByConcept.values()].filter(
      ({ nameNormalized }) => {
        return nameNormalized.includes(normalizedPhrase);
      },
    );

    const LIMIT = 300;
    // TODO: Implement a better/more efficient way to filter and sort the
    // results. Fuse.js maybe?
    // https://github.com/users/wujekbogdan/projects/1/views/1?pane=issue&itemId=110658002
    return results
      .sort((a, b) => b.clusters.length - a.clusters.length)
      .slice(0, LIMIT);
  };

  return {
    labels: labelsCollection.filter(({ normalizedLabel }) =>
      normalizedLabel.includes(normalizedPhrase),
    ),
    points: points(),
  };
};
