import { transfer } from "comlink";
import { select, ZoomTransform, zoom, zoomIdentity } from "d3";
import { useRef, useEffect, useState, useMemo } from "react";
import styled from "styled-components";
import useSWR from "swr";
import { useShallow } from "zustand/react/shallow";
import { loadData } from "../../api/worker.ts";
import { useStore } from "../../store.ts";
import ConfigEditor from "./ConfigEditor.tsx";
import { drawOnCanvas } from "./drawOnCanvas.ts";
import { schema, useConfigStore } from "./store.ts";

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
  const [
    thresholds,
    size,
    blur,
    oneBitMode,
    oneBitThreshold,
    setThresholds,
    setSize,
    setBlur,
    setOneBitThreshold,
    setOneBitMode,
  ] = useConfigStore(
    useShallow((s) => [
      s.thresholds,
      s.size,
      s.blur,
      s.oneBitMode,
      s.oneBitThreshold,
      s.setThresholds,
      s.setSize,
      s.setBlur,
      s.setOneBitThreshold,
      s.setOneBitMode,
    ]),
  );

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
  const dataAsArray = useMemo(() => {
    if (!data?.dataPoints) return [];
    return Array.from(data.dataPoints.values());
  }, [data?.dataPoints]);
  const serializedFormState = JSON.stringify({
    blur,
    thresholds,
    size: {
      width: size.width,
      height: size.height,
    },
    oneBitMode,
    oneBitThreshold,
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
      oneBitMode,
      oneBitThreshold,
      data: dataAsArray,
    }).catch((error) => {
      throw new Error("Error drawing on canvas: " + error);
    });

    hasInitialized.current = true;
  }, [
    thresholds,
    dataAsArray,
    size,
    blur,
    transform,
    oneBitThreshold,
    oneBitMode,
    data?.dataPoints,
  ]);

  const textareaOnChange = (value: string) => {
    const json = (): unknown => {
      try {
        return JSON.parse(value);
      } catch {
        return "";
      }
    };
    const parsed = schema.safeParse(json());
    if (!parsed.success) {
      return;
    }

    const { data } = parsed;

    setBlur(data.blur);
    setThresholds(data.thresholds);
    setSize(data.size);
    setOneBitMode(data.oneBitMode);
    setOneBitThreshold(data.oneBitThreshold);
  };

  return isLoading ? (
    <>Loading...</>
  ) : (
    <Container>
      <EditorContainer>
        <ConfigEditor />
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
        <Textarea
          rows={6}
          onChange={(e) => {
            textareaOnChange(e.target.value);
          }}
          value={serializedFormState}
        />
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

const Textarea = styled.textarea`
  font-family: monospace;
  width: 100%;
  resize: none;
`;

export default CanvasMap;
