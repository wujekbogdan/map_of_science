import { ZodError } from "zod";
import { describe, it, expect } from "@map-of-science/vitest";
import { parse } from "../../../vite-plugin/svg-map-parser.ts";
import validSvg from "./valid-svg.test.svg?raw";

// TODO: Move this test to /vite-plugin/parser.test.ts
// Temporarily placed here because, for some reason, even when Vite test is explicitly configured to include that file, it still doesn't work
describe("SVG Map Parser Vite Plugin", () => {
  it("should parse a valid SVG", async () => {
    expect(await parse(validSvg)).toMatchSnapshot();
  });

  it("should throw an error if the provided string isn't a valid SVG", async () => {
    await expect(parse("invalid svg")).rejects.toThrow(
      "Non-whitespace before first tag",
    );
  });

  it("should throw a schema validation error if the provided SVG is valid but does not follow the schema", async () => {
    const svg = `
      <svg>
        <g>
          <rect />
        </g>
      </svg>
    `;
    await expect(parse(svg)).rejects.toThrow(ZodError);
  });
});
