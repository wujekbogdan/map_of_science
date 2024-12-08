import { describe, it, expect, vi } from "vitest";
import { parse, parseFromUrl } from "./parse";
import { withRequestInterception } from "../test-utils/request-interception.ts";

const CSV = "name\tage\nAlice\t30\nBob\t40";

describe("csv", () => {
  describe("parse", () => {
    it("should parse CSV", async () => {
      const fetcher = vi.fn(() => CSV);
      const asyncFetcher = vi.fn(() => Promise.resolve(CSV));
      const transformer = (row: unknown) => row;

      const resultNonAsync = await parse(fetcher, transformer);
      const resultAsync = await parse(asyncFetcher, transformer);
      const expected = new Set([
        { name: "Alice", age: "30" },
        { name: "Bob", age: "40" },
      ]);

      expect(fetcher).toHaveBeenCalledOnce();
      expect(asyncFetcher).toHaveBeenCalledOnce();
      expect(resultNonAsync).toEqual(expected);
      expect(resultAsync).toEqual(expected);
    });

    it("should transform rows", async () => {
      const fetcher = () => CSV;

      const result = await parse(fetcher, (row) => ({
        name: `transformed ${row.name}`,
        age: parseInt(row.age),
      }));
      const expected = new Set([
        { name: "transformed Alice", age: 30 },
        { name: "transformed Bob", age: 40 },
      ]);

      expect(result).toEqual(expected);
    });

    it("should fail to parse CSV if transformer fails", async () => {
      const transformer = () => {
        throw new Error("Failed to transform");
      };

      return expect(parse(() => CSV, transformer)).rejects.toThrow(
        "Failed to transform",
      );
    });
  });

  describe("parseFromUrl", () => {
    it(
      "should parse CSV from URL",
      withRequestInterception(
        ({ http, HttpResponse }) => [
          http.get("https://example.com/csv", () => {
            return HttpResponse.text(CSV);
          }),
        ],
        async () => {
          const result = await parseFromUrl(
            "https://example.com/csv",
            (row: unknown) => row,
          );

          expect(result).toEqual(
            new Set([
              { name: "Alice", age: "30" },
              { name: "Bob", age: "40" },
            ]),
          );
        },
      ),
    );

    it(
      "should fail if request fails",
      withRequestInterception(
        ({ http, HttpResponse }) => [
          http.get("https://example.com/csv", () => {
            return HttpResponse.error();
          }),
        ],
        async () => {
          try {
            await parseFromUrl("https://example.com/csv", (row) => row);
          } catch (error) {
            expect(error).toEqual(new Error("Failed to fetch"));
          }
          expect.hasAssertions();
        },
      ),
    );

    it(
      "should fail if request doesn't fail, but response is not 200",
      withRequestInterception(
        ({ http, HttpResponse }) => [
          http.get("https://example.com/csv", () => {
            return new HttpResponse(null, {
              status: 404,
            });
          }),
        ],
        async () => {
          try {
            await parseFromUrl("https://example.com/csv", (row) => row);
          } catch (error) {
            expect(error).toEqual(
              new Error("Failed to fetch csv from: https://example.com/csv"),
            );
          }
          expect.hasAssertions();
        },
      ),
    );
  });
});
