import { MapSvgRepresentation } from "../../vite-plugin/svg-map-parser.ts";
import { normalizeSync } from "normalize-diacritics";

type Model = {
  id: string;
  label: string;
  normalizedLabel: string;
  center: {
    x: number;
    y: number;
  };
}[];

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
  label: path.label,
  normalizedLabel: normalize(path.label),
  center: path.boundingBox.center,
});

export const mapModel = (map: MapSvgRepresentation) => [
  ...map.layer1.children.map(({ path }) => mapPath(path)),
  ...map.layer2.children.map(({ path }) => mapPath(path)),
  ...map.layer3.groups.flatMap((group) =>
    group.children.map(({ rect }) => ({
      id: rect.id,
      label: rect.label.replace("#", ""),
      normalizedLabel: normalize(rect.label),
      center: rect.boundingBox.center,
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
