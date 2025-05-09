import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";
import { z } from "zod";
import { ZodSchema } from "zod";
import { DataSchema, ConceptSchema, CityLabelSchema } from ".";
import { setCollector } from "../../csv/collector.ts";
import { parse as csvParse } from "../../csv/parse.ts";

const parse = async (name: string, schema: ZodSchema) => {
  const filePath = fileURLToPath(
    new URL(`./__test__/${name}`, import.meta.url),
  );
  const file = await readFile(filePath, "utf-8");
  const collector = setCollector();

  await csvParse(
    () => file, // Correctly pass provider function
    (row) => {
      collector.add(schema.parse(row));
    },
  );

  return collector.getResults();
};

describe("schema", () => {
  describe("data.tsv", () => {
    it("should parse data.tsv", async () => {
      const [withLabel, withoutLabel] = await parse("data.tsv", DataSchema(z));

      expect([withLabel, withoutLabel]).toEqual([
        {
          clusterId: 84872,
          x: -90.2114,
          y: -71.396,
          numRecentArticles: 228,
          clusterCategory: 5,
          growthRating: 15.43,
          keyConcepts: [198432, 37537, 12177, 43800, 43431],
        },
        {
          clusterId: 72062,
          x: -76.1376,
          y: -37.2588,
          numRecentArticles: 239,
          clusterCategory: 5,
          growthRating: 3.22,
          keyConcepts: [40293, 71377, 120209, 90737, 67314],
        },
      ]);
    });
  });

  describe("keys.tsv", () => {
    it("should parse keys keys.tsv", async () => {
      const [firstItem] = await parse("keys.tsv", ConceptSchema(z));
      expect(firstItem).toEqual({
        index: 0,
        key: "12-20210031",
      });
    });
  });

  describe("labels.tsv", () => {
    it("should parse labels labels.tsv", async () => {
      const [firstItem] = await parse("labels.tsv", CityLabelSchema(z));
      expect(firstItem).toEqual({
        clusterId: 3988,
        label: "Osobowość i różnice międzyosobnicze zwierząt",
      });
    });
  });
});
