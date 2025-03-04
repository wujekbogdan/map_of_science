import { describe, it, expect } from "vitest";
import { dataSchema, conceptSchema, cityLabelSchema } from ".";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";
import { ZodSchema } from "zod";
import { parse as csvParse, setCollector } from "../csv/parse.ts";

const parse = async (name: string, schema: ZodSchema) => {
  const filePath = fileURLToPath(
    new URL(`./__test__/${name}`, import.meta.url),
  );
  const file = await readFile(filePath, "utf-8");
  const collector = setCollector();

  return csvParse(
    () => file,
    (row) => {
      collector.collect(schema.parse(row));
    },
  ).then(collector.getResult);
};

describe("schema", () => {
  describe("data.tsv", () => {
    it("should parse data.tsv", async () => {
      const [firstItem] = await parse("data.tsv", dataSchema);
      expect(firstItem).toEqual({
        clusterCategory: 5,
        clusterId: 84872,
        growthRating: 15.43,
        keyConcepts: [198432, 37537, 12177, 43800, 43431],
        numRecentArticles: 228,
        x: -90.2114,
        y: -71.396,
      });
    });
  });

  describe("keys.tsv", () => {
    it("should parse keys keys.tsv", async () => {
      const [firstItem] = await parse("keys.tsv", conceptSchema);
      expect(firstItem).toEqual({
        index: 0,
        key: "12-20210031",
      });
    });
  });

  describe("labels.tsv", () => {
    it("should parse labels labels.tsv", async () => {
      const [firstItem] = await parse("labels.tsv", cityLabelSchema);
      expect(firstItem).toEqual({
        clusterId: 3988,
        label: "Osobowość i różnice międzyosobnicze zwierząt",
      });
    });
  });
});
