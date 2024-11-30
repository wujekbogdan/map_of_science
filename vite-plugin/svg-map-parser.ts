import { Plugin } from "vite";
import { createFilter } from "@rollup/pluginutils";
import { Parser } from "xml2js";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { z } from "zod";
import styleToObject from "style-to-object";
import { svgPathBbox } from "svg-path-bbox";

const l1L2Schema = z.object({
  attributes: z.object({
    "inkscape:label": z.string(),
    id: z.string(),
    style: z.string(),
  }),
  path: z.array(
    z.object({
      attributes: z.object({
        class: z.string().optional(),
        "inkscape:label": z.string(),
        style: z.string(),
        d: z.string(),
        id: z.string(),
      }),
    }),
  ),
});

const l3Schema = z.object({
  attributes: z.object({
    "inkscape:label": z.string(),
    id: z.string(),
    style: z.string(),
  }),
  g: z.array(
    z.object({
      attributes: z.object({
        "inkscape:label": z.string(),
        id: z.string(),
      }),
      rect: z.array(
        z.object({
          attributes: z.object({
            id: z.string(),
            style: z.string(),
            width: z.coerce.number(),
            height: z.coerce.number(),
            x: z.coerce.number(),
            y: z.coerce.number(),
            "inkscape:label": z.string(),
          }),
        }),
      ),
    }),
  ),
});

const schema = z.object({
  svg: z.object({
    g: z.tuple([l1L2Schema, l1L2Schema, l3Schema]),
  }),
});

type ParsedSvg = z.infer<typeof schema>;

export const parse = async (svgString: string) => {
  // Type casting is fine here because we're validating the parsed object with zod anyway
  const parser = new Parser({
    attrkey: "attributes",
  });
  const parsedSvg = (await parser.parseStringPromise(svgString)) as ParsedSvg;

  const validated = schema.parse(parsedSvg);

  const style = (style: string) => styleToObject(style) ?? {};

  const map1st2ndLayer = (layer: z.infer<typeof l1L2Schema>) => ({
    attributes: {
      id: layer.attributes.id,
      label: layer.attributes["inkscape:label"],
      style: style(layer.attributes.style),
    },
    children: layer.path.map(({ attributes }) => ({
      path: {
        id: attributes.id,
        label: attributes["inkscape:label"],
        style: style(attributes.style),
        d: attributes.d,
        boundingBox: (() => {
          const [minx, miny, maxX, maxY] = svgPathBbox(attributes.d);
          return {
            min: { x: minx, y: miny },
            max: { x: maxX, y: maxY },
            center: {
              x: (minx + maxX) / 2,
              y: (miny + maxY) / 2,
            },
          };
        })(),
      },
    })),
  });

  const map3rdLayer = (layer: z.infer<typeof l3Schema>) => ({
    attributes: {
      id: layer.attributes.id,
      label: layer.attributes["inkscape:label"],
      style: style(layer.attributes.style),
    },
    groups: layer.g.map((group) => ({
      attributes: {
        id: group.attributes.id,
        label: group.attributes["inkscape:label"],
      },
      children: group.rect.map(({ attributes }) => ({
        rect: {
          id: attributes.id,
          label: attributes["inkscape:label"],
          style: style(attributes.style),
          width: attributes.width,
          height: attributes.height,
          x: attributes.x,
          y: attributes.y,
        },
      })),
    })),
  });

  const [layer1, layer2, layer3] = validated.svg.g;

  return {
    layer1: map1st2ndLayer(layer1),
    layer2: map1st2ndLayer(layer2),
    layer3: map3rdLayer(layer3),
  };
};

export type MapSvgRepresentation = Awaited<ReturnType<typeof parse>>;

export default function svgMapParser(): Plugin {
  const filter = createFilter(/\.(svg)$/, null);

  return {
    name: "vite-plugin-svg-map-parser",

    async transform(_, id) {
      if (!id.includes("?parse")) return null;

      const [filepath] = id.split("?"); // Get the actual file path
      if (!filter(filepath)) return null;

      if (!existsSync(filepath)) {
        this.error(`File not found: ${filepath}`);
      }

      const svgData = readFileSync(resolve(filepath), "utf-8");

      return {
        code: `export default ${JSON.stringify(await parse(svgData))};`,
        map: null,
      };
    },
  };
}
