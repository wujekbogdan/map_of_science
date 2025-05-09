import { describe, it, expect, vi } from "vitest";
import { withRequestInterception } from "../test-utils/request-interception.ts";
import { parse, withHttpProvider } from "./parse";

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

  describe("withHttpProvider", () => {
    it(
      "should fetch CSV from URL and process each row",
      withRequestInterception(
        ({ http, HttpResponse }) => [
          http.get("https://example.com/csv", () => HttpResponse.text(CSV)),
        ],
        async () => {
          const onItem = vi.fn();
          await withHttpProvider("https://example.com/csv", onItem);

          expect(onItem).toHaveBeenCalledTimes(2);
          expect(onItem).toHaveBeenNthCalledWith(1, {
            name: "Alice",
            age: "30",
          });
          expect(onItem).toHaveBeenNthCalledWith(2, { name: "Bob", age: "40" });
        },
      ),
    );
  });
});
