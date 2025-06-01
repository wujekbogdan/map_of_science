import {
  offset,
  useFloating,
  useHover,
  useInteractions,
  useTransitionStyles,
  flip,
  shift,
} from "@floating-ui/react";
import { useState } from "react";
import { createPortal } from "react-dom";
import { Concept, DataPoint as Point } from "../../api/model";
import { useArticleStore } from "../../store.ts";
import { DataPointDetails } from "./DataPointDetails.tsx";
import css from "./DataPoints.module.scss";

type Props = {
  concepts: Map<number, Concept>;
  forcedSize?: boolean;
  points: Point[];
};

const configByThreshold = [
  { min: 2001, level: 1 },
  { min: 1001, level: 2 },
  { min: 501, level: 3 },
  { min: 201, level: 4 },
  { min: 51, level: 5 },
  { min: 0, level: 6 },
] as const;

type ShapeOptions = {
  point: Point;
  forcedSize: boolean;
};

const classes = (classList: string[]) => classList.join(" ");

const Shape = (options: ShapeOptions) => {
  const { point, forcedSize } = options;
  const { x, y } = point;
  const config = configByThreshold.find(
    ({ min }) => point.numRecentArticles >= min,
  );
  const level =
    config?.level ?? configByThreshold[configByThreshold.length - 1].level;

  const classList = forcedSize
    ? [css.circle, css[`level-${level.toString()}`], css.searchResults]
    : [css.circle, css[`level-${level.toString()}`]];

  return <circle className={classes(classList)} cx={x} cy={y} />;
};

export const DataPoints = ({ points, concepts, forcedSize }: Props) => {
  const setRemoteArticleId = useArticleStore(
    ({ setRemoteArticleId }) => setRemoteArticleId,
  );
  const [hoveredPoint, setHoveredPoint] = useState<Point | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const { refs, floatingStyles, context } = useFloating({
    middleware: [offset(10), flip(), shift({ padding: 10 })],
    open: isOpen,
    onOpenChange: setIsOpen,
  });
  const { isMounted, styles } = useTransitionStyles(context, {
    duration: { open: 300, close: 0 },
    initial: { opacity: 0 },
    open: { opacity: 1 },
  });
  const shouldCreatePortal = isMounted && hoveredPoint !== null;
  const hover = useHover(context, {
    delay: {
      open: 50,
      close: 0,
    },
  });
  const { getReferenceProps, getFloatingProps } = useInteractions([hover]);

  return (
    <>
      {points.map((point) => {
        const label = concepts.get(point.clusterId)?.key;

        return (
          <g
            className={classes([css.group, css.fadeIn])}
            key={point.clusterId}
            aria-label={label}
            ref={
              hoveredPoint?.clusterId === point.clusterId
                ? refs.setReference
                : null
            }
            onPointerEnter={() => {
              setHoveredPoint(point);
            }}
            onPointerLeave={() => {
              setHoveredPoint(null);
            }}
            onClick={() => {
              setRemoteArticleId(point.clusterId);
            }}
            {...(hoveredPoint?.clusterId === point.clusterId
              ? getReferenceProps()
              : {})}
          >
            <Shape point={point} forcedSize={!!forcedSize} />
          </g>
        );
      })}

      {shouldCreatePortal && (
        <>
          {createPortal(
            <div
              ref={refs.setFloating}
              style={{ ...floatingStyles, ...styles }}
              {...getFloatingProps()}
            >
              <DataPointDetails point={hoveredPoint} concepts={concepts} />
            </div>,
            document.body,
          )}
        </>
      )}
    </>
  );
};
