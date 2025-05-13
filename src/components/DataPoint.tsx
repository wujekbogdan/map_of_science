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
import styled, { keyframes } from "styled-components";
import { Concept, DataPoint as Point } from "../api/model";
import { useArticleStore } from "../store.ts";
import { DataPointDetails } from "./DataPointDetails.tsx";

type Props = {
  point: Point;
  concepts: Map<number, Concept>;
  zoom: number;
  forceShape?: boolean;
};

export const DataPoint = ({ point, concepts, zoom, forceShape }: Props) => {
  const setRemoteArticleId = useArticleStore(
    ({ setRemoteArticleId }) => setRemoteArticleId,
  );
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
  const hover = useHover(context, {
    delay: {
      open: 50,
      close: 0,
    },
  });
  const { getReferenceProps, getFloatingProps } = useInteractions([hover]);

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
  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  const transform = `translate(${x}, ${y}) scale(${1 / zoom})`;

  const shape = () => {
    if (forceShape) {
      return (
        <circle
          className="circle outer"
          x={0}
          y={0}
          r={10}
          fill="red"
          stroke="black"
          strokeWidth={1}
        />
      );
    }

    if (config.shape === "square") {
      const outer = 14;
      const inner = 8;

      return (
        <>
          <rect
            className="square outer"
            x={-outer / 2}
            y={-outer / 2}
            width={outer}
            height={outer}
            fill="white"
            stroke="black"
            strokeWidth={1}
          />
          <rect
            className="square inner"
            x={-inner / 2}
            y={-inner / 2}
            width={inner}
            height={inner}
            fill="black"
          />
        </>
      );
    }

    if (config.shape === "double-circle") {
      return (
        <>
          <circle
            className="double-circle outer"
            x={0}
            y={0}
            r={config.radius}
            fill="white"
            stroke="black"
            strokeWidth={1}
          />
          <circle
            className="double-circle inner"
            cx={0}
            cy={0}
            r={config.innerRadius}
            fill={config.radius === 7 ? "black" : "white"}
            stroke="black"
            strokeWidth={1}
          />
        </>
      );
    }

    return (
      <circle
        className="circle outer"
        x={0}
        y={0}
        r={config.radius}
        fill="white"
        stroke="black"
        strokeWidth={1}
      />
    );
  };

  return (
    <>
      <Group
        aria-label={label}
        transform={transform}
        ref={refs.setReference}
        {...getReferenceProps()}
        onClick={() => {
          setRemoteArticleId(point.clusterId);
        }}
      >
        {shape()}
      </Group>

      {isMounted && (
        <>
          {createPortal(
            <div
              ref={refs.setFloating}
              style={{ ...floatingStyles, ...styles }}
              {...getFloatingProps()}
            >
              <DataPointDetails point={point} concepts={concepts} />
            </div>,
            document.body,
          )}
        </>
      )}
    </>
  );
};

const hoverColor = "#9b5b9b";
const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;
const Group = styled.g`
  opacity: 0;
  animation: ${fadeIn} 0.3s ease-in-out forwards;

  &:hover {
    cursor: pointer;

    .square,
    .circle,
    .double-circle {
      transition:
        fill 0.3s,
        stroke 0.3s;
    }

    .square {
      &.outer {
        stroke: ${hoverColor};
      }
      &.inner {
        fill: ${hoverColor};
      }
    }

    .circle {
      stroke: white;
      fill: ${hoverColor};
    }

    .double-circle {
      &.outer {
        stroke: ${hoverColor};
      }
      &.inner {
        stroke: ${hoverColor};
        fill: ${hoverColor};
      }
    }
  }
`;
