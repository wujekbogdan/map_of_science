import { select, ZoomTransform, zoom, zoomIdentity } from "d3";
import uniqueId from "lodash/uniqueId";
import { useRef, useEffect, useState, useMemo } from "react";
import styled from "styled-components";
import { useShallow } from "zustand/react/shallow";
import { DataPoint } from "../../api/model";
import ConfigEditor from "./ConfigEditor.tsx";
import { useCanvasDrawer } from "./canvasDrawer.ts";
import { defineStore, schema } from "./store.ts";

type Props = {
  data: DataPoint[];
  store: ReturnType<typeof defineStore>;
};

const CanvasMap = (props: Props) => {
  const id = useMemo(() => uniqueId(), []);
  const { draw } = useCanvasDrawer();
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
  ] = props.store(
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

  return (
    <Container>
      <EditorContainer>
        <ConfigEditor store={props.store} />
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
  position: relative;
`;

const Canvas = styled.canvas`
  display: block;
  margin: 20px auto;
  cursor: pointer;
`;

const EditorContainer = styled.div`
  position: absolute;
  top: 0;
  left: 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.8);
  background: #ededed;
`;

const Textarea = styled.textarea`
  font-family: monospace;
  width: 100%;
  resize: none;
`;

export default CanvasMap;
