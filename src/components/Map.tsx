import { useMemo, useRef, useState } from "react";
import styled from "styled-components";
import { useShallow } from "zustand/react/shallow";
import { MapSvgRepresentation } from "../../vite-plugin/svg-map-parser.ts";
import { isArticleAvailable } from "../api/article";
import { Concept, DataPoint as Point } from "../api/model";
import { useArticleStore, useStore } from "../store";
import { useD3Zoom } from "../useD3Zoom.ts";
import { useLayersOpacity } from "../useLayersOpacity.ts";
import { DataPoint } from "./DataPoint.tsx";

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
      $hasArticle={props.hasArticle}
      $fontSize={props.fontSize}
      $opacity={props.opacity}
      $level={props.level}
      onClick={onClick}
    >
      {props.text}
    </LabelText>
  );
};

type Props = {
  map: MapSvgRepresentation;
  size: {
    width: number;
    height: number;
  };
  cityLabels: {
    label: string;
    clusterId: number;
    x: number;
    y: number;
  }[];
  dataPoints: Point[];
  concepts: Map<number, Concept>;
  on?: {
    labelClick?: OnLabelClick;
  };
};

export default function Map(props: Props) {
  const { map, cityLabels, on } = props;
  const [scaleFactor, fontSize, desiredZoom, maxDataPointsInViewport] =
    useStore(
      useShallow((s) => [
        s.scaleFactor,
        s.fontSize,
        s.desiredZoom,
        s.maxDataPointsInViewport,
      ]),
    );
  const fetchLocalArticle = useArticleStore(
    ({ fetchLocalArticle }) => fetchLocalArticle,
  );

  const svgRoot = useRef<SVGSVGElement>(null);
  const [mapVisibility, setMapVisibility] = useState<"visible" | "hidden">(
    "hidden",
  );
  const { transform, zoom } = useD3Zoom({
    svg: svgRoot,
    initialZoom: {
      x: props.size.width / 2,
      y: props.size.height / 2,
      scale: 1,
    },
    desiredZoom,
    initialized: () => {
      setMapVisibility("visible");
    },
  });
  const transformValue = transform ? transform.toString() : "";
  const opacity = useLayersOpacity(zoom);

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
      return {
        key: label.clusterId.toString(),
        x: label.x,
        y: label.y,
        text: label.label,
        fontSize: scaledFontSize.layer4,
        opacity: opacity.layer4,
        level: 4,
      } as const;
    });
  }, [cityLabels, scaledFontSize.layer4, opacity]);

  const labels = [
    ...map.layer1.children.map(
      ({ path }) =>
        ({
          ...getLabelPropsByPath(path),
          fontSize: scaledFontSize.layer1,
          opacity: opacity.layer1,
          level: 1,
        }) as const,
    ),
    ...map.layer2.children.map(
      ({ path }) =>
        ({
          ...getLabelPropsByPath(path),
          fontSize: scaledFontSize.layer2,
          opacity: opacity.layer2,
          level: 2,
        }) as const,
    ),
    ...map.layer3.groups.flatMap((group) =>
      group.children.map(
        ({ rect }) =>
          ({
            ...getLabelPropsByRect(rect),
            fontSize: scaledFontSize.layer3,
            opacity: opacity.layer3,
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

  // TODO: dataPoints seem to use the same coordinate system as the SVG.
  // The (0, 0) point is not the top-left corner — it's the center of the SVG map and the data space.
  // Not sure where this alignment comes from — it's just an observed behavior.
  // It's fine for now, but we might want to introduce d3-based scaling to decouple the map from data coordinates.
  const data = useMemo(() => {
    return props.dataPoints.map((point) => ({
      ...point,
      y: -point.y,
    }));
  }, [props.dataPoints]);

  // TODO: This isn't efficient. Use quadtree or a similar method to determine which points are in the viewport.
  const dataInViewport = data
    .filter((point) => {
      if (!transform) return false;

      const screenX = transform.applyX(point.x);
      const screenY = transform.applyY(point.y);

      return (
        screenX >= 0 &&
        screenX <= props.size.width &&
        screenY >= 0 &&
        screenY <= props.size.height
      );
    })
    .slice(0, maxDataPointsInViewport);

  return (
    <MapSvg
      $visibility={mapVisibility}
      ref={svgRoot}
      width={props.size.width}
      height={props.size.height}
    >
      <g transform={transformValue} opacity={opacity.layer1}>
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
        <g
          id={map.layer2.attributes.id}
          style={map.layer2.attributes.style}
          opacity={opacity.layer2}
        >
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

        <g id="data-points">
          {dataInViewport.map((point) => (
            <DataPoint
              zoom={zoom}
              point={point}
              concepts={props.concepts}
              key={point.clusterId}
            />
          ))}
        </g>

        <g id="labels">
          {labels.map((label) => (
            <Label
              {...label}
              key={label.key}
              onClick={({ text }) => {
                void fetchLocalArticle(text);
              }}
            />
          ))}
        </g>
      </g>
    </MapSvg>
  );
}

const MapSvg = styled.svg<{
  $visibility: "visible" | "hidden";
}>`
  visibility: ${(props) => props.$visibility};
  display: block;
`;

const labelFillColor = ($level: 1 | 2 | 3 | 4) => {
  switch ($level) {
    case 1:
      return "rgb(153, 91, 153)";
    case 2:
      return "rgb(57, 57, 57)";
    case 3:
      return "rgb(101, 91, 153)";
    default:
      return "inherit";
  }
};

const LabelText = styled.text<{
  $opacity: number;
  $fontSize: number;
  $level: 1 | 2 | 3 | 4;
  $hasArticle: boolean;
}>`
  cursor: ${(props) => (props.$hasArticle ? "pointer" : "default")};
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
  fill: ${(props) => labelFillColor(props.$level)};
  &:hover {
    fill: ${(props) =>
      props.$hasArticle ? "#4A90E2" : labelFillColor(props.$level)};
  }
`;
