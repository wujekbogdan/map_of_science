import { z } from "zod";

export const dataSchema = z
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
    y: data.y,
    numRecentArticles: data.num_recent_articles,
    clusterCategory: data.cluster_category,
    growthRating: data.growth_rating,
    keyConcepts: data.key_concepts.split(",").map((id) => Number(id)),
  }));

export const conceptSchema = z.object({
  index: z.coerce.number(),
  key: z.string(),
});

export const cityLabelSchema = z
  .object({
    cluster_id: z.coerce.number(),
    label: z.string(),
  })
  .transform((data) => ({
    clusterId: data.cluster_id,
    label: data.label,
  }));

export type CityLabel = z.infer<typeof cityLabelSchema>;
export type Concept = z.infer<typeof conceptSchema>;
export type DataPoint = z.infer<typeof dataSchema>;
