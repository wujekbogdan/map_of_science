import { select, ZoomTransform, zoom } from "d3";
import uniqueId from "lodash/uniqueId";
import { useRef, useEffect, useState, useMemo } from "react";
import styled from "styled-components";
import { useShallow } from "zustand/react/shallow";
import { DataPoint } from "../../api/model";
import { useCanvasDrawer } from "./canvasDrawer.ts";
import { defineStore } from "./store.ts";

type Transform = {
  x: number;
  y: number;
  k: number;
};

type Props = {
  name: string;
  data: DataPoint[];
  store: ReturnType<typeof defineStore>;
  onTransformChange?: (transform: Transform) => void;
  fixed?: {
    size: {
      width: number;
      height: number;
    };
    transform: Transform;
  };
};

const CanvasMap = (props: Props) => {
  const id = useMemo(() => uniqueId(), []);
  const { draw } = useCanvasDrawer();
  const [thresholds, size, blur, oneBitMode, oneBitThreshold, color, setSize] =
    props.store(
      useShallow((s) => [
        s.thresholds,
        s.size,
        s.blur,
        s.oneBitMode,
        s.oneBitThreshold,
        s.color,
        s.setSize,
      ]),
    );

  const [transform, setTransform] = useState({
    x: 0,
    y: 0,
    k: 1,
  });
  const canvas = useRef<HTMLCanvasElement>(null);
  const offscreenRef = useRef<OffscreenCanvas | null>(null);
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (!canvas.current) return;
    if (props.fixed) return;

    const d3Zoom = zoom<HTMLCanvasElement, unknown>()
      .scaleExtent([1, 20])
      .on("zoom", (event: { transform: ZoomTransform }) => {
        props.onTransformChange?.(event.transform);
        setTransform(event.transform);
      });

    select(canvas.current).call(d3Zoom);
  });

  useEffect(() => {
    if (!canvas.current) return;
    offscreenRef.current ??= canvas.current.transferControlToOffscreen();

    draw({
      id,
      transform: {
        x: transform.x,
        y: transform.y,
        k: transform.k,
      },
      blur: blur,
      shouldTransfer: !hasInitialized.current,
      thresholds: thresholds,
      canvas: offscreenRef.current,
      width: size.width,
      height: size.height,
      oneBitMode,
      oneBitThreshold,
      data: props.data,
      color,
    }).catch((error) => {
      throw new Error("Error drawing on canvas: " + error);
    });

    hasInitialized.current = true;
  }, [
    thresholds,
    props.data,
    size,
    blur,
    transform,
    oneBitThreshold,
    oneBitMode,
    draw,
    color,
    id,
  ]);

  useEffect(() => {
    if (!props.fixed) return;
    const { size, transform } = props.fixed;

    setSize(size);
    setTransform(transform);
  }, [props.fixed, setSize, setTransform]);

  return (
    <Container>
      <Canvas ref={canvas} />
    </Container>
  );
};

const Container = styled.div`
  position: relative;
`;

const Canvas = styled.canvas`
  display: block;
  cursor: pointer;
`;

export default CanvasMap;
