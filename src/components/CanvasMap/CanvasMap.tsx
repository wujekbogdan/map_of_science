import { transfer } from "comlink";
import { select, ZoomTransform, zoom, zoomIdentity } from "d3";
import { useRef, useEffect, useState } from "react";
import styled from "styled-components";
import useSWR from "swr";
import { useShallow } from "zustand/react/shallow";
import { loadData } from "../../api/worker.ts";
import { useStore } from "../../store.ts";
import ConfigEditor from "./ConfigEditor.tsx";
import { Threshold, drawOnCanvas } from "./drawOnCanvas.ts";

type DrawParams = Parameters<typeof drawOnCanvas>[0] & {
  shouldTransfer: boolean;
  canvas: OffscreenCanvas;
};

const worker = new ComlinkWorker<typeof import("./drawOnCanvas.ts")>(
  new URL("./drawOnCanvas.ts", import.meta.url),
);

const draw = (args: DrawParams) => {
  const { canvas, ...otherProps } = args;
  const obj = { canvas, ...otherProps };

  if (args.shouldTransfer) {
    transfer(obj, [canvas]);
  }
  const props = args.shouldTransfer ? obj : { ...otherProps };

  return worker.drawOnCanvas(props);
};

const CanvasMap = () => {
  const [thresholds, setThresholds] = useState<Threshold[]>([
    { min: 0, size: 1, visible: true },
    { min: 51, size: 2, visible: true },
    { min: 201, size: 3, visible: true },
    { min: 501, size: 5, visible: true },
    { min: 1001, size: 5, visible: true },
    { min: 2001, size: 6, visible: true },
  ]);
  const [size, setSize] = useState({ width: 1000, height: 1000 });
  const [blur, setBlur] = useState(0);
  const [transform, setTransform] = useState(zoomIdentity);
  const canvas = useRef<HTMLCanvasElement>(null);
  const offscreenRef = useRef<OffscreenCanvas | null>(null);
  const hasInitialized = useRef(false);

  const [setDataPoints] = useStore(useShallow((s) => [s.setDataPoints]));
  const { data, isLoading } = useSWR("data", loadData, {
    onSuccess: ({ dataPoints }) => {
      setDataPoints(dataPoints);
    },
  });

  useEffect(() => {
    if (!canvas.current) return;

    const d3Zoom = zoom<HTMLCanvasElement, unknown>()
      .scaleExtent([1, 20])
      .on("zoom", (event: { transform: ZoomTransform }) => {
        setTransform(event.transform);
      });

    select(canvas.current).call(d3Zoom);
  });

  useEffect(() => {
    if (!canvas.current || !data?.dataPoints) return;
    offscreenRef.current ??= canvas.current.transferControlToOffscreen();

    draw({
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
      data: [...data.dataPoints.values()],
    }).catch((error) => {
      throw new Error("Error drawing on canvas: " + error);
    });

    hasInitialized.current = true;
  }, [thresholds, data, size, blur, transform]);

  return isLoading ? (
    <>Loading...</>
  ) : (
    <Container>
      <EditorContainer>
        <ConfigEditor
          thresholds={thresholds}
          size={size}
          blur={0}
          onThresholdsChange={setThresholds}
          onSizeChange={setSize}
          onBlurChange={setBlur}
        />
        <p>
          Transform:
          {` x: ${transform.x.toFixed(2)}, y: ${transform.y.toFixed(
            2,
          )}, zoom: ${transform.k.toFixed(2)}`}
        </p>
        <p>
          <button
            onClick={() => {
              setTransform({
                x: 0,
                y: 0,
                k: 1,
              } as ZoomTransform);
            }}
          >
            Reset pan/zoom
          </button>
        </p>
      </EditorContainer>
      <Canvas ref={canvas} />
    </Container>
  );
};

const Container = styled.div`
  min-height: 100vh;
`;

const Canvas = styled.canvas`
  display: block;
  margin: 20px auto;
  cursor: pointer;
`;

const EditorContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  padding: 10px;
  background: rgba(255, 255, 255, 0.8);
`;

export default CanvasMap;
