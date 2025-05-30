import { describe, it, expect } from "@map-of-science/vitest";
import { arrayCollector, mapCollector, setCollector } from "./collector.ts";

describe("collectors", () => {
  describe("arrayCollector", () => {
    it("should collect items in an array", () => {
      const collector = arrayCollector();
      collector.add("Alice");
      collector.add("Bob");

      expect(collector.getResults()).toEqual(["Alice", "Bob"]);
    });
  });

  describe("setCollector", () => {
    it("should collect unique items in a set", () => {
      const collector = setCollector();
      collector.add("Alice");
      collector.add("Bob");
      collector.add("Alice"); // Duplicate

      expect(collector.getResults()).toEqual(new Set(["Alice", "Bob"]));
    });
  });

  describe("mapCollector", () => {
    it("should collect items in a map using the provided key function", () => {
      const collector = mapCollector<string, { id: string; name: string }>(
        (item) => item.id,
      );

      collector.add({ id: "1", name: "Alice" });
      collector.add({ id: "2", name: "Bob" });
      collector.add({ id: "1", name: "Charlie" }); // Overwrites "Alice"

      expect(collector.getResults()).toEqual(
        new Map([
          ["1", { id: "1", name: "Charlie" }], // Last value wins
          ["2", { id: "2", name: "Bob" }],
        ]),
      );
    });
  });
});
