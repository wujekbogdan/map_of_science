import { z as zod } from "zod";

export const ConceptSchema = (z: typeof zod) =>
  z.object({
    index: z.coerce.number(),
    key: z.string(),
  });
export type Concept = zod.infer<ReturnType<typeof ConceptSchema>>;

export const CityLabelSchema = (z: typeof zod) =>
  z
    .object({
      cluster_id: z.coerce.number(),
      label: z.string(),
    })
    .transform((data) => ({
      clusterId: data.cluster_id,
      label: data.label,
    }));
export type CityLabel = zod.infer<ReturnType<typeof CityLabelSchema>>;

export const DataSchema = (z: typeof zod, labels: Map<number, CityLabel>) =>
  z
    .object({
      cluster_id: z.coerce.number(),
      x: z.coerce.number(),
      y: z.coerce.number(),
      num_recent_articles: z.coerce.number(),
      cluster_category: z.coerce.number(),
      growth_rating: z.coerce.number(),
      key_concepts: z.string(),
    })
    .transform((data) => ({
      clusterId: data.cluster_id,
      x: data.x,
      y: -data.y, // To align it with the map coordinate system
      numRecentArticles: data.num_recent_articles,
      clusterCategory: data.cluster_category,
      growthRating: data.growth_rating,
      keyConcepts: data.key_concepts.split(",").map((id) => Number(id)),
      cityLabel: labels.get(data.cluster_id)?.label ?? null,
    }));
export type DataPoint = zod.infer<ReturnType<typeof DataSchema>>;
