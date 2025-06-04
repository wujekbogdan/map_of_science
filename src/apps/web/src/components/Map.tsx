import { ZoomTransform } from "d3";
import { CSSProperties, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import { useShallow } from "zustand/react/shallow";
import { MapSvgRepresentation } from "../../vite-plugin/svg-map-parser.ts";
import { isArticleAvailable } from "../api/article";
import { Concept, DataPoint as Point } from "../api/model";
import { useArticleStore, useStore } from "../store";
import { useD3Zoom } from "../useD3Zoom.ts";
import { useLayersOpacity } from "../useLayersOpacity.ts";
import { DataPoints } from "./DataPoints/DataPoints.tsx";
import backgroundImage from "./map-background.svg";
import "./map.css";

type Label = {
  id: string;
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

const filterDataByViewport = (
  dataPoints: Point[],
  transform: ZoomTransform,
  limit: number,
  size: {
    width: number;
    height: number;
  },
) => {
  const dataInViewport: Point[] = [];

  // Although .filter() would feel more natural, the regular for loop is way
  // faster since we can easily break the loop when we reach the limit.
  for (const point of dataPoints) {
    const screenX = transform.applyX(point.x);
    const screenY = transform.applyY(point.y);

    if (
      screenX >= 0 &&
      screenX <= size.width &&
      screenY >= 0 &&
      screenY <= size.height
    ) {
      dataInViewport.push(point);
      if (dataInViewport.length >= limit) break;
    }
  }

  return dataInViewport;
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
  dataPoints: Map<number, Point>;
  concepts: Map<number, Concept>;
  on?: {
    labelClick?: OnLabelClick;
  };
};

export default function Map(props: Props) {
  const { map, cityLabels, on } = props;
  const [
    scaleFactor,
    fontSize,
    desiredZoom,
    maxDataPointsInViewport,
    clustersToHighlight,
  ] = useStore(
    useShallow((s) => [
      s.scaleFactor,
      s.fontSize,
      s.desiredZoom,
      s.maxDataPointsInViewport,
      s.pointsToHighlight,
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
  // https://github.com/users/wujekbogdan/projects/1/views/1?pane=issue&itemId=110651849
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

  const dataInViewport = !transform
    ? []
    : filterDataByViewport(
        [...props.dataPoints.values()],
        transform,
        maxDataPointsInViewport,
        props.size,
      );

  const HighlightedPoints = useMemo(() => {
    const pointsToHighlight = clustersToHighlight
      .map((id) => props.dataPoints.get(id))
      .filter((point) => point !== undefined);

    const inViewport = !transform
      ? []
      : filterDataByViewport(
          pointsToHighlight,
          transform,
          Infinity,
          props.size,
        );

    return (
      <DataPoints
        points={inViewport}
        forcedSize={true}
        concepts={props.concepts}
      />
    );
  }, [
    clustersToHighlight,
    transform,
    props.size,
    props.concepts,
    props.dataPoints,
  ]);

  const backgroundStyles = useMemo(() => {
    if (!transform) {
      return {};
    }

    const viewBox = {
      width: 18340.723,
      height: 18561.087,
    };

    // const [xMin, xMax] = extent(
    //   [...props.dataPoints.values()],
    //   (point) => point.x,
    // ) as [number, number];
    // const xRange = xMax - xMin;
    // const scaleFactor = xRange / viewBox.width;
    // scaleFactor = 0.0584202596593384;
    const SCALE_FACTOR = 0.058;
    const offset = {
      x: -16.6,
      y: 27,
    };

    const scale = SCALE_FACTOR * transform.k;
    const scaledWidth = viewBox.width * scale;
    const scaledHeight = viewBox.height * scale;
    const bgX = transform.x + offset.x * transform.k - scaledWidth / 2;
    const bgY = transform.y + offset.y * transform.k - scaledHeight / 2;

    return {
      backgroundImage: `url(${backgroundImage})`,
      backgroundRepeat: "no-repeat",
      backgroundSize: `${scaledWidth}px ${scaledHeight}px`,
      backgroundPosition: `${bgX}px ${bgY}px`,
    };
  }, [transform]);

  return (
    <MapSvg
      style={backgroundStyles}
      $visibility={mapVisibility}
      ref={svgRoot}
      width={props.size.width}
      height={props.size.height}
      $zoom={zoom}
    >
      <g transform={transformValue} opacity={opacity.layer1}>
        <g>
          <DataPoints points={dataInViewport} concepts={props.concepts} />

          {HighlightedPoints}
        </g>

        <g>
          {labels.map((label) => (
            <Label
              {...label}
              id={label.key}
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

const MapSvg = styled.svg.attrs<{
  $visibility: "visible" | "hidden";
  $zoom: number;
}>((props) => ({
  style: {
    "--zoom-scale": props.$zoom,
  } as CSSProperties,
}))`
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

const LabelText = styled.text.attrs<{
  $fontSize: number;
  $opacity: number;
}>((props) => ({
  style: {
    fontSize: `${props.$fontSize.toString()}px`,
    opacity: props.$opacity,
  },
}))<{
  $level: 1 | 2 | 3 | 4;
  $hasArticle: boolean;
}>`
  cursor: ${(props) => (props.$hasArticle ? "pointer" : "default")};
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
