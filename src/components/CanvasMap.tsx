import { transfer } from "comlink";
import { useRef, useEffect } from "react";
import styled from "styled-components";
import useSWR from "swr";
import { useShallow } from "zustand/react/shallow";
import { loadData } from "../api/worker.ts";
import { useStore } from "../store.ts";
import { drawOnCanvas } from "./drawOnCanvas.ts";

export const worker = (...props: Parameters<typeof drawOnCanvas>) => {
  const worker = new ComlinkWorker<typeof import("./drawOnCanvas.ts")>(
    new URL("./drawOnCanvas.ts", import.meta.url),
  );

  const [{ canvas, ...otherProps }] = props;
  const obj = {
    canvas,
    ...otherProps,
  };

  transfer(obj, [canvas]);
  return worker.drawOnCanvas(obj);
};

const CanvasMap = () => {
  const canvas = useRef<HTMLCanvasElement>(null);
  const hasInitialized = useRef(false);

  const [setDataPoints] = useStore(useShallow((s) => [s.setDataPoints]));
  const { data, isLoading } = useSWR("data", loadData, {
    onSuccess: ({ dataPoints }) => {
      setDataPoints(dataPoints);
    },
  });

  const size = {
    width: 1200,
    height: 1200,
  };

  useEffect(() => {
    if (hasInitialized.current) return;
    if (!canvas.current) return;
    if (!data?.dataPoints) return;

    worker({
      canvas: canvas.current.transferControlToOffscreen(),
      width: size.width,
      height: size.height,
      data: [...data.dataPoints.values()],
    }).catch((error) => {
      throw new Error(`Error while drawing on canvas: ${error}`);
    });

    hasInitialized.current = true;
  });

  return isLoading ? (
    <>Loading...</>
  ) : (
    <Container>
      <Canvas ref={canvas} width={size.width} height={size.height} />
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

export default CanvasMap;
