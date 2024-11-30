import { normalizeSync } from "normalize-diacritics";
import { MapSvgRepresentation } from "../../vite-plugin/svg-map-parser.ts";

export type Model = {
  id: string;
  label: string;
  normalizedLabel: string;
  boundingBox: {
    min: { x: number; y: number };
    max: { x: number; y: number };
    center: { x: number; y: number };
  };
}[];

// FIXME: This isn't exactly right. The code assumes that the model never changes.
// It's true in practice, but in theory one could change call the search function
// with a different map parameter each time.
export let cachedModel: Model | null = null;

/**
 * Normalize a string by removing diacritics and converting to lowercase.
 */
const normalize = (str: string) =>
  normalizeSync(str.replace("#", "").toLowerCase());

const mapPath = (
  path: MapSvgRepresentation["layer1"]["children"][number]["path"],
) => ({
  id: path.id,
  label: path.label.replace("#", ""),
  normalizedLabel: normalize(path.label),
  boundingBox: path.boundingBox,
});

export const mapModel = (map: MapSvgRepresentation) => [
  ...map.layer1.children.map(({ path }) => mapPath(path)),
  ...map.layer2.children.map(({ path }) => mapPath(path)),
  ...map.layer3.groups.flatMap((group) =>
    group.children.map(({ rect }) => ({
      id: rect.id,
      label: rect.label.replace("#", ""),
      normalizedLabel: normalize(rect.label),
      boundingBox: rect.boundingBox,
    })),
  ),
];

export const search = (map: MapSvgRepresentation, phrase: string) => {
  const model = cachedModel ?? (cachedModel = mapModel(map));
  if (!phrase) return [];
  return model.filter(({ normalizedLabel }) =>
    normalizedLabel.includes(normalize(phrase).toLowerCase()),
  );
};
