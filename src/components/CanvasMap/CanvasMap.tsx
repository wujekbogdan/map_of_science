import { transfer } from "comlink";
import { useRef, useEffect, useState } from "react";
import styled from "styled-components";
import useSWR from "swr";
import { useShallow } from "zustand/react/shallow";
import { loadData } from "../../api/worker.ts";
import { useStore } from "../../store.ts";
import ConfigEditor from "./ConfigEditor.tsx";
import { ConfigEntry, drawOnCanvas } from "./drawOnCanvas.ts";

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
  const [config, setConfig] = useState<ConfigEntry[]>([
    { min: 0, size: 1, visible: true },
    { min: 51, size: 2, visible: true },
    { min: 201, size: 3, visible: true },
    { min: 501, size: 5, visible: true },
    { min: 1001, size: 5, visible: true },
    { min: 2001, size: 6, visible: true },
  ]);
  const [size, setSize] = useState({ width: 1000, height: 1000 });
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
    if (!canvas.current || !data?.dataPoints) return;
    offscreenRef.current ??= canvas.current.transferControlToOffscreen();

    draw({
      shouldTransfer: !hasInitialized.current,
      config,
      canvas: offscreenRef.current,
      width: size.width,
      height: size.height,
      data: [...data.dataPoints.values()],
    }).catch((error) => {
      throw new Error("Error drawing on canvas: " + error);
    });

    hasInitialized.current = true;
  }, [config, data, size]);

  return isLoading ? (
    <>Loading...</>
  ) : (
    <Container>
      <EditorContainer>
        <ConfigEditor
          config={config}
          size={size}
          onConfigChange={setConfig}
          onSizeChange={setSize}
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
`;

const EditorContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
`;

export default CanvasMap;
