import { select, ZoomTransform, zoom, extent as d3extent } from "d3";
import uniqueId from "lodash/uniqueId";
import { useRef, useEffect, useMemo, Ref, useImperativeHandle } from "react";
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
  ref?: Ref<{ download: () => void }>;
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
  const [
    thresholds,
    size,
    transform,
    blur,
    oneBitMode,
    oneBitThreshold,
    color,
    setSize,
    setTransform,
  ] = props.store(
    useShallow((s) => [
      s.thresholds,
      s.size,
      s.transform,
      s.blur,
      s.oneBitMode,
      s.oneBitThreshold,
      s.color,
      s.setSize,
      s.setTransform,
    ]),
  );
  const canvas = useRef<HTMLCanvasElement>(null);
  const offscreenRef = useRef<OffscreenCanvas | null>(null);
  const hasInitialized = useRef(false);
  const extent = useMemo(() => {
    return {
      x: d3extent(props.data, (d) => d.x) as [number, number],
      y: d3extent(props.data, (d) => d.y) as [number, number],
    };
  }, [props.data]);

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
      extent,
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
    extent,
  ]);

  useEffect(() => {
    if (!props.fixed) return;
    const { size, transform } = props.fixed;

    setSize(size);
    setTransform(transform);
  }, [props.fixed, setSize, setTransform]);

  useImperativeHandle(props.ref, () => ({
    download: () => {
      if (!canvas.current) return;

      const dataURL = canvas.current.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = dataURL;
      link.download = `${props.name || "canvas"}.png`;
      link.click();
    },
  }));

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
