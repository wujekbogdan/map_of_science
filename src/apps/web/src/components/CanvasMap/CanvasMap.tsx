import { select, ZoomTransform, zoom } from "d3";
import uniqueId from "lodash/uniqueId";
import { useRef, useEffect, useState, useMemo } from "react";
import styled from "styled-components";
import { useShallow } from "zustand/react/shallow";
import { DataPoint } from "../../api/model";
import TogglablePanel from "../TogglablePanel/TogglablePanel.tsx";
import { useCanvasDrawer } from "./canvasDrawer.ts";
import { defineStore, schema } from "./store.ts";

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
  const [
    thresholds,
    size,
    blur,
    oneBitMode,
    oneBitThreshold,
    color,
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
      s.color,
      s.setThresholds,
      s.setSize,
      s.setBlur,
      s.setOneBitThreshold,
      s.setOneBitMode,
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
      <div style={{ display: "none" }}>
        <EditorContainer>
          <TogglablePanel header={props.name} initialState="expanded">
            <>
              <p>
                Transform:
                {` x: ${transform.x.toFixed(2)}, y: ${transform.y.toFixed(
                  2,
                )}, zoom: ${transform.k.toFixed(2)}`}
              </p>
              <p>
                <button
                  onClick={() => {
                    const reset = {
                      x: 0,
                      y: 0,
                      k: 1,
                    };
                    setTransform(reset);
                    props.onTransformChange?.(reset);
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
            </>
          </TogglablePanel>
        </EditorContainer>
      </div>

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

const EditorContainer = styled.div`
  position: absolute;
  top: 0;
  left: 12px;
  padding: 12px;
  background: #ededed;
`;

const Textarea = styled.textarea`
  font-family: monospace;
  width: 100%;
  resize: none;
`;

export default CanvasMap;
