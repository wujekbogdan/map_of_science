import { useMemo } from "react";
import { ScaleLinear } from "d3";
import styled from "styled-components";
import { MapSvgRepresentation } from "../vite-plugin/svg-map-parser.ts";
import { useStore } from "./store";
import { screenToForegroundCoordinates } from "./js/foreground";
import { isArticleAvailable } from "./js/article";
import { Concept, DataPoint } from "./schema";

type Label = {
  key: string;
  x: number;
  y: number;
  text: string;
  fontSize: number;
  opacity: number;
  level: 1 | 2 | 3 | 4;
  hasArticle: boolean;
  onClick?: OnLabelClick;
};

type OnLabelClick = (label: Pick<Label, "text" | "x" | "y">) => void;

const Label = (props: Label) => {
  const onClick =
    props.hasArticle && props.onClick
      ? () => {
          props.onClick?.({
            text: props.text,
            x: props.x,
            y: props.y,
          });
        }
      : undefined;

  return (
    <LabelText
      display={props.opacity ? "block" : "none"}
      key={props.key}
      textAnchor="middle"
      alignmentBaseline="middle"
      x={props.x}
      y={props.y}
      $fontSize={props.fontSize}
      $opacity={props.opacity}
      $level={props.level}
      onClick={onClick}
    >
      {props.text}
    </LabelText>
  );
};

type D3Scale = ScaleLinear<number, number>;

type Props = {
  map: MapSvgRepresentation;
  scale: {
    x: D3Scale;
    y: D3Scale;
  };
  zoom: number;
  visibility: [number, number, number, number];
  cityLabels: {
    label: string;
    clusterId: number;
    x: number;
    y: number;
  }[];
  dataPoints: DataPoint[];
  concepts: Map<number, Concept>;
  on?: {
    labelClick?: OnLabelClick;
  };
};

const DATA_POINTS_LIMIT = 300;

const isInViewport = (point: DataPoint, scale: { x: D3Scale; y: D3Scale }) => {
  const { x, y } = point;
  const [xMin, xMax] = scale.x.domain();
  const [yMin, yMax] = scale.y.domain();

  return x >= xMin && x <= xMax && y >= yMin && y <= yMax;
};

type DataPointProps = {
  point: DataPoint;
  concepts: Map<number, Concept>;
};

const DataPointShape = ({ point, concepts }: DataPointProps) => {
  const configByThreshold = [
    { min: 2001, shape: "square" },
    { min: 1001, shape: "double-circle", radius: 7, innerRadius: 4 },
    { min: 501, shape: "double-circle", radius: 6, innerRadius: 3 },
    { min: 201, shape: "double-circle", radius: 5, innerRadius: 2 },
    { min: 51, shape: "circle", radius: 4 },
    { min: 0, shape: "circle", radius: 3 },
  ] as const;
  const { x, y } = point;
  const config = configByThreshold.find(
    ({ min }) => point.numRecentArticles >= min,
  );

  if (!config) {
    console.error("Unable to find config for point:", point);
    return null;
  }

  const label = concepts.get(point.clusterId)?.key;

  if (config.shape === "square") {
    const outer = 14;
    const inner = 8;
    return (
      <g aria-label={label}>
        <rect
          x={x - outer / 2}
          y={y - outer / 2}
          width={outer}
          height={outer}
          fill="white"
          stroke="black"
          strokeWidth={1}
        />
        <rect
          x={x - inner / 2}
          y={y - inner / 2}
          width={inner}
          height={inner}
          fill="black"
        />
      </g>
    );
  }

  if (config.shape === "double-circle") {
    return (
      <g aria-label={label}>
        <circle
          cx={x}
          cy={y}
          r={config.radius}
          fill="white"
          stroke="black"
          strokeWidth={1}
        />
        <circle
          cx={x}
          cy={y}
          r={config.innerRadius}
          fill={config.radius === 7 ? "black" : "white"}
          stroke="black"
          strokeWidth={1}
        />
      </g>
    );
  }

  return (
    <g aria-label={label}>
      <circle
        cx={x}
        cy={y}
        r={config.radius}
        fill="white"
        stroke="black"
        strokeWidth={1}
      />
    </g>
  );
};

export default function Map(props: Props) {
  const { map, zoom, visibility, cityLabels, on } = props;
  const { scaleFactor, fontSize } = useStore();

  // TODO: move to the model and display labels conditionally in the JSX rather than rendering an empty text element
  const replaceHash = (str: string) =>
    str.startsWith("#") ? str.replace("#", "") : "";

  const getLabelPropsByPath = (
    path: (typeof map.layer1.children)[number]["path"],
  ) => {
    const { x, y } = path.boundingBox.center;

    return {
      key: path.id + path.label,
      x: x,
      y: y,
      text: replaceHash(path.label),
    };
  };

  const getLabelPropsByRect = (
    rect: (typeof map.layer3.groups)[number]["children"][number]["rect"],
  ) => {
    return {
      // The original label.js code uses some kind of scaling here, but it's not clear why.
      // style: {
      //   left: `${scale.x(x)} px}`,
      //   top: `${scale.y(-y)} px}`,
      // },
      key: rect.id + rect.label,
      x: rect.boundingBox.center.x,
      y: rect.boundingBox.center.y,
      text: replaceHash(rect.label),
    };
  };

  const scaleFontSize = (size: number) => {
    const baseScaleFactor = 1 / zoom;
    const factor = Math.sqrt(
      Math.min(
        Math.max(scaleFactor.min, zoom * scaleFactor.zoom),
        scaleFactor.max,
      ),
    );

    return size * baseScaleFactor * factor;
  };
  const scaledFontSize = {
    layer1: scaleFontSize(fontSize.layer1),
    layer2: scaleFontSize(fontSize.layer2),
    layer3: scaleFontSize(fontSize.layer3),
    layer4: scaleFontSize(fontSize.layer4),
  };

  const cityLabelsScaled = useMemo(() => {
    return cityLabels.map((label) => {
      const { x, y } = screenToForegroundCoordinates(label.x, label.y);
      return {
        key: label.clusterId.toString(),
        x: x,
        y: y,
        text: label.label,
        fontSize: scaledFontSize.layer4,
        opacity: visibility[3],
        level: 4,
      } as const;
    });
  }, [cityLabels, scaledFontSize.layer4, visibility]);

  const labels: Label[] = [
    ...map.layer1.children.map(
      ({ path }) =>
        ({
          ...getLabelPropsByPath(path),
          fontSize: scaledFontSize.layer1,
          opacity: visibility[0],
          level: 1,
        }) as const,
    ),
    ...map.layer2.children.map(
      ({ path }) =>
        ({
          ...getLabelPropsByPath(path),
          fontSize: scaledFontSize.layer2,
          opacity: visibility[1],
          level: 2,
        }) as const,
    ),
    ...map.layer3.groups.flatMap((group) =>
      group.children.map(
        ({ rect }) =>
          ({
            ...getLabelPropsByRect(rect),
            fontSize: scaledFontSize.layer3,
            opacity: visibility[2],
            level: 3,
          }) as const,
      ),
    ),
    ...cityLabelsScaled,
  ].map((label) => ({
    ...label,
    hasArticle: isArticleAvailable(label.text),
    onClick: () => {
      if (on?.labelClick) {
        on.labelClick({
          text: replaceHash(label.text),
          x: label.x,
          y: label.y,
        });
      }
    },
  }));

  const dataPointsInViewport = useMemo(() => {
    return props.dataPoints
      .filter((point) => isInViewport(point, props.scale))
      .slice(0, DATA_POINTS_LIMIT)
      .map((point) => ({
        // TODO: Any scaling needed here? If not, drop x, y together with the map loop
        ...point,
        x: point.x,
        y: point.y,
      }));
  }, [props.dataPoints, props.scale]);

  return (
    <svg>
      {/* Layer 1 */}
      <g id={map.layer1.attributes.id} style={map.layer1.attributes.style}>
        {map.layer1.children.map(({ path }) => (
          <path
            key={path.id}
            id={path.id}
            d={path.d}
            style={path.style}
            data-label={path.label}
          />
        ))}
      </g>

      {/* Layer 2 */}
      <g id={map.layer2.attributes.id} style={map.layer2.attributes.style}>
        {map.layer2.children.map(({ path }) => (
          <path
            key={path.id}
            id={path.id}
            d={path.d}
            style={path.style}
            data-label={path.label}
          />
        ))}
      </g>

      {/* Layer 3 */}
      <g id={map.layer3.attributes.id} style={map.layer3.attributes.style}>
        {map.layer3.groups.map((group) => (
          <g key={group.attributes.id} id={group.attributes.id}>
            {group.children.map(({ rect }) => (
              <rect
                key={rect.id}
                id={rect.id}
                width={rect.width}
                height={rect.height}
                x={rect.x}
                y={rect.y}
                style={rect.style}
                data-label={rect.label}
              />
            ))}
          </g>
        ))}
      </g>

      <g id="data-points">
        {dataPointsInViewport.map((point) => (
          <DataPointShape
            point={point}
            concepts={props.concepts}
            key={point.clusterId}
          />
        ))}
      </g>

      <g id="L4">
        {
          // A dummy element required by foreground.js that relies on DOM element to determine opacity values
          // TODO: remove once foreground.js functionality is fully ported to React
        }
      </g>

      <g id="labels">
        {labels.map((label) => (
          <Label {...label} key={label.key} />
        ))}
      </g>
    </svg>
  );
}

const LabelText = styled.text<{
  $opacity: number;
  $fontSize: number;
  $level: 1 | 2 | 3 | 4;
}>`
  font-size: ${(props) => props.$fontSize}px;
  opacity: ${(props) => props.$opacity};
  font-weight: bold;
  // TODO: It can be, very likely, replaced with a simplified text-shadow
  text-shadow:
    0 0 1px #f2efe9,
    0 0 2px #f2efe9,
    0 0 5px #f2efe9,
    0 0 5px #f2efe9,
    0 0 5px #f2efe9,
    0 0 5px #f2efe9,
    0 0 5px #f2efe9,
    0 0 5px #f2efe9,
    0 0 5px #f2efe9,
    0 0 5px #f2efe9;
  fill: ${(props) => {
    switch (props.$level) {
      case 1:
        return "rgb(153, 91, 153)";
      case 2:
        return "rgb(57, 57, 57)";
      case 3:
        return "rgb(101, 91, 153)";
      case 4:
        return "inherit";
    }
  }};
  &:hover {
    fill: red !important;
  }
`;
