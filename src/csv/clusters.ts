import { parseFromUrlWithSchema } from "./parse.ts";

export const load = () => {
  const url = new URL("../../asset/data.tsv", import.meta.url).href;
  return parseFromUrlWithSchema(url, (z) => {
    return z
      .object({
        cluster_id: z.coerce.number(),
        x: z.coerce.number(),
        y: z.coerce.number(),
        num_recent_articles: z.coerce.number(),
        cluster_category: z.coerce.number(),
        growth_rating: z.coerce.number(),
        key_concepts: z.coerce.number(),
      })
      .transform((data) => ({
        clusterId: data.cluster_id,
        x: data.x,
        y: data.y,
        numRecentArticles: data.num_recent_articles,
        clusterCategory: data.cluster_category,
        growthRating: data.growth_rating,
        keyConcepts: data.key_concepts,
      }));
  });
};
