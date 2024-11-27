import { MapSvgRepresentation } from "../vite-plugin/svg-map-parser.ts";
import { svgPathBbox } from "svg-path-bbox";

type Props = {
  map: MapSvgRepresentation;
};

type Label = {
  x: number;
  y: number;
  text: string;
  fontSize: string;
  fill: string;
};

const Label = (props: Label) => {
  return (
    <text
      textAnchor="middle"
      alignmentBaseline="middle"
      x={props.x}
      y={props.y}
      style={{
        fontSize: "12px",
        fill: "black",
      }}
    >
      {props.text}
    </text>
  );
};

export default function Map({ map }: Props) {

  const getPathBoundingBoxCenter = (d: string) => {
    const [minx, miny, maxX, maxY] = svgPathBbox(d);

    return {
      x: (minx + maxX) / 2,
      y: (miny + maxY) / 2,
    };
  };

  const getLabelPropsByPath = (
    path: (typeof map.layer1.children)[number]["path"],
  ) => {
    const { x, y } = getPathBoundingBoxCenter(path.d);
    return {
      x,
      y,
      // TODO: move to the model and display labels conditionally in the JSX
      text: path.label.startsWith('#') ? path.label.replace("#", "") : "",
      fontSize: "12px",
      fill: "black",
    };
  };

  const getLabelPropsByRect = (
    rect: (typeof map.layer3.groups)[number]["children"][number]["rect"],
  ) => {
    return {
      x: (rect.x + rect.width) / 2,
      y: (rect.y + rect.height) / 2,
      text: rect.label,
      fontSize: "12px",
      fill: "black",
    };
  };

  const model = {
    layer1: {
      attributes: map.layer1.attributes,
      children: map.layer1.children.map(({ path }) => ({
        path: path,
        label: getLabelPropsByPath(path),
      })),
    },
    layer2: {
      attributes: map.layer2.attributes,
      children: map.layer2.children.map(({ path }) => ({
        path: path,
        label: getLabelPropsByPath(path),
      })),
    },
    layer3: {
      attributes: map.layer3.attributes,
      groups: map.layer3.groups.map((group) => ({
        attributes: group.attributes,
        children: group.children.map(({ rect }) => ({
          rect,
          label: getLabelPropsByRect(rect),
        })),
      })),
    },
  };

  return (
    <svg>
      {/* Layer 1 */}
      <g id={model.layer1.attributes.id} style={map.layer1.attributes.style}>
        {model.layer1.children.map(({ path, label }) => (
          <>
            <path
              key={path.id}
              id={path.id}
              d={path.d}
              style={path.style}
              data-label={path.label}
            />
            <Label {...label} />
          </>
        ))}
      </g>

      {/* Layer 2 */}
      <g id={model.layer2.attributes.id} style={map.layer2.attributes.style}>
        {model.layer1.children.map(({ path, label }) => (
          <>
            <path
              key={path.id}
              id={path.id}
              d={path.d}
              style={path.style}
              data-label={path.label}
            />
            <Label {...label} />
          </>
        ))}
      </g>

      {/* Layer 3 */}
      <g id={model.layer3.attributes.id} style={map.layer3.attributes.style}>
        {model.layer3.groups.map((group) => (
          <g key={group.attributes.id} id={group.attributes.id}>
            {group.children.map(({ rect, label }) => (
              <>
                <rect
                  id={rect.id}
                  width={rect.width}
                  height={rect.height}
                  x={rect.x}
                  y={rect.y}
                  style={rect.style}
                  data-label={rect.label}
                />
                <Label {...label} />
              </>
            ))}
          </g>
        ))}
      </g>
    </svg>
  );
}
