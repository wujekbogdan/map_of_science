import { describe, it, expect, vi } from "vitest";
import {
  setCollector,
  parse,
  parseFromUrlWithSchema,
  mapCollector,
} from "./parse";
import { withRequestInterception } from "../test-utils/request-interception.ts";

const CSV = "name\tage\nAlice\t30\nBob\t40";

describe("csv", () => {
  describe("parse", () => {
    it("should parse CSV with non-async provider", async () => {
      const provider = vi.fn(() => CSV);
      const onItem = vi.fn();

      await parse(provider, onItem);

      expect(onItem).toHaveBeenCalledTimes(2);
      expect(onItem).toHaveBeenNthCalledWith(1, { name: "Alice", age: "30" });
      expect(onItem).toHaveBeenNthCalledWith(2, { name: "Bob", age: "40" });
    });

    it("should parse CSV with async provider", async () => {
      const provider = vi.fn(() => Promise.resolve(CSV));
      const onItem = vi.fn();

      await parse(provider, onItem);

      expect(onItem).toHaveBeenCalledTimes(2);
      expect(onItem).toHaveBeenNthCalledWith(1, { name: "Alice", age: "30" });
      expect(onItem).toHaveBeenNthCalledWith(2, { name: "Bob", age: "40" });
    });

    it("should fail to parse CSV if onItem fails", async () => {
      const provider = vi.fn(() => Promise.resolve(CSV));
      const onItem = () => {
        throw new Error("onItem failed");
      };

      return expect(parse(provider, onItem)).rejects.toThrow("onItem failed");
    });
  });

  describe("parseFromUrlWithSchema", () => {
    it(
      "should parse CSV from URL with zod schema with setCollector",
      withRequestInterception(
        ({ http, HttpResponse }) => [
          http.get("https://example.com/csv", () => HttpResponse.text(CSV)),
        ],
        async () => {
          const result = await parseFromUrlWithSchema({
            url: "https://example.com/csv",
            defineSchema: (z) => {
              return z.object({
                name: z.string(),
                age: z.coerce.number(),
              });
            },
            Collector: setCollector,
          });

          expect(result).toEqual(
            new Set([
              { name: "Alice", age: 30 },
              { name: "Bob", age: 40 },
            ]),
          );
        },
      ),
    );

    it(
      "should parse CSV from URL with zod schema with mapCollector",
      withRequestInterception(
        ({ http, HttpResponse }) => [
          http.get("https://example.com/csv", () => HttpResponse.text(CSV)),
        ],
        async () => {
          const result = await parseFromUrlWithSchema({
            url: "https://example.com/csv",
            defineSchema: (z) => {
              return z.object({
                name: z.string(),
                age: z.coerce.number(),
              });
            },
            Collector: (schema) => mapCollector(schema, (item) => item.name),
          });

          expect(result).toEqual(
            new Map([
              ["Alice", { name: "Alice", age: 30 }],
              ["Bob", { name: "Bob", age: 40 }],
            ]),
          );
        },
      ),
    );
  });
});
